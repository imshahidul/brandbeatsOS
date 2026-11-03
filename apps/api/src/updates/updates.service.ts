import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  diffJsonSchema,
  validateSectionLayout,
  validateSettings,
  type SectionInstanceInput,
  type ThemeManifest,
} from '@brand-beats/theme-sdk';
import { ThemesService } from '../themes/themes.service';
import { ThemeVersion } from '../themes/theme-version.entity';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { ThemeInstall } from '../marketplace/theme-install.entity';
import { CustomizerService } from '../customizer/customizer.service';
import { MerchantThemeSettings } from '../customizer/merchant-theme-settings.entity';
import { PublishedSnapshot } from '../customizer/published-snapshot.entity';
import { UpdateStaging } from './update-staging.entity';

function semverCmp(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function getPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj,
    );
}

export interface CompatibilityIssue {
  path: string;
  kind: 'removed' | 'invalid';
  message: string;
}

export interface CompatibilityReport {
  compatible: boolean;
  currentVersion: string;
  targetVersion: string;
  issues: CompatibilityIssue[];
  schemaDiff: { removed: string[]; added: string[] };
}

@Injectable()
export class UpdatesService {
  constructor(
    private readonly themes: ThemesService,
    private readonly marketplace: MarketplaceService,
    private readonly customizer: CustomizerService,
    @InjectRepository(UpdateStaging)
    private readonly stagings: Repository<UpdateStaging>,
    @InjectRepository(PublishedSnapshot)
    private readonly snapshots: Repository<PublishedSnapshot>,
    @InjectRepository(MerchantThemeSettings)
    private readonly drafts: Repository<MerchantThemeSettings>,
    @InjectRepository(ThemeInstall)
    private readonly installs: Repository<ThemeInstall>,
  ) {}

  /** Installs with newer published versions available (the "update notifications"). */
  async listAvailable(tenantId: string) {
    const installs = await this.installs.find({ where: { tenantId } });
    const out = [];
    for (const install of installs) {
      const theme = await this.themes.getThemeById(install.themeId);
      const current = await this.themes.getVersionById(
        install.activeVersionId,
      );
      const newer = (await this.themes.listVersions(theme.id))
        .filter(
          (v) =>
            v.status === 'published' && semverCmp(v.version, current.version) > 0,
        )
        .sort((a, b) => semverCmp(b.version, a.version));
      if (newer.length > 0) {
        out.push({
          installId: install.id,
          theme: { slug: theme.slug, name: theme.name },
          currentVersion: current.version,
          autoUpdatePolicy: install.autoUpdatePolicy,
          updates: newer.map((v) => ({
            versionId: v.id,
            version: v.version,
            changelog: v.changelog,
          })),
        });
      }
    }
    return out;
  }

  private async resolveTarget(
    install: ThemeInstall,
    targetVersionId: string,
  ): Promise<{ current: ThemeVersion; target: ThemeVersion }> {
    const current = await this.themes.getVersionById(install.activeVersionId);
    const target = await this.themes.getVersionById(targetVersionId);
    if (target.themeId !== install.themeId) {
      throw new BadRequestException('Target version belongs to a different theme');
    }
    if (target.status !== 'published') {
      throw new BadRequestException('Target version is not published');
    }
    if (semverCmp(target.version, current.version) <= 0) {
      throw new BadRequestException('Target version must be newer than current');
    }
    return { current, target };
  }

  /**
   * Compatibility check (spec §9 steps 3–5): validates the merchant's
   * current customization against the target version and reports
   * removed/invalid settings. Never mutates anything.
   */
  async checkCompatibility(
    install: ThemeInstall,
    targetVersionId: string,
    override?: {
      settings?: Record<string, unknown>;
      sections?: Array<Record<string, unknown>>;
    },
  ): Promise<CompatibilityReport> {
    const { current, target } = await this.resolveTarget(
      install,
      targetVersionId,
    );
    const draft = await this.customizer.getOrCreateDraft(install.id);
    const settings = override?.settings ?? draft.settings;
    const sections = override?.sections ?? draft.sections;

    const issues: CompatibilityIssue[] = [];
    const newManifest = target.manifest as unknown as ThemeManifest;

    const s = validateSettings(
      target.configSchema as Record<string, unknown>,
      settings,
    );
    for (const e of s.errors) {
      issues.push({
        path: e.split(' ')[0],
        kind: 'invalid',
        message: `Setting ${e}`,
      });
    }

    const diff = diffJsonSchema(
      current.configSchema as Record<string, unknown>,
      target.configSchema as Record<string, unknown>,
    );
    for (const p of diff.removed) {
      if (getPath(settings, p) !== undefined) {
        issues.push({
          path: p,
          kind: 'removed',
          message: `Setting "${p}" was removed by the theme update`,
        });
      }
    }

    const l = validateSectionLayout(
      newManifest,
      sections as unknown as SectionInstanceInput[],
    );
    for (const e of l.errors) {
      issues.push({ path: 'sections', kind: 'invalid', message: e });
    }

    return {
      compatible: issues.length === 0,
      currentVersion: current.version,
      targetVersion: target.version,
      issues,
      schemaDiff: diff,
    };
  }

  async check(
    installId: string,
    tenantId: string,
    targetVersionId: string,
  ): Promise<CompatibilityReport> {
    const install = await this.marketplace.findInstall(installId, tenantId);
    return this.checkCompatibility(install, targetVersionId);
  }

  /** Creates (or re-targets) a staging area seeded from the current draft. */
  async stageUpdate(
    installId: string,
    tenantId: string,
    targetVersionId: string,
  ) {
    const install = await this.marketplace.findInstall(installId, tenantId);
    const report = await this.checkCompatibility(install, targetVersionId);
    const draft = await this.customizer.getOrCreateDraft(install.id);

    let staging = await this.stagings.findOne({ where: { installId: install.id } });
    if (!staging) {
      staging = this.stagings.create({
        installId: install.id,
        targetVersionId,
        stagedSettings: draft.settings,
        stagedSections: draft.sections,
        issues: report.issues as unknown as Array<Record<string, unknown>>,
      });
    } else {
      staging.targetVersionId = targetVersionId;
      staging.stagedSettings = draft.settings;
      staging.stagedSections = draft.sections;
      staging.issues = report.issues as unknown as Array<Record<string, unknown>>;
    }
    staging = await this.stagings.save(staging);
    return { staging, report };
  }

  async getStaging(installId: string, tenantId: string) {
    const install = await this.marketplace.findInstall(installId, tenantId);
    const staging = await this.stagings.findOne({
      where: { installId: install.id },
    });
    if (!staging) throw new NotFoundException('No staged update');
    return staging;
  }

  async discardStaging(
    installId: string,
    tenantId: string,
  ): Promise<{ ok: true }> {
    const staging = await this.getStaging(installId, tenantId);
    await this.stagings.remove(staging);
    return { ok: true };
  }

  private async refreshStagingIssues(staging: UpdateStaging) {
    const install = await this.installs.findOne({
      where: { id: staging.installId },
    });
    if (!install) throw new NotFoundException('Install not found');
    const report = await this.checkCompatibility(
      install,
      staging.targetVersionId,
      {
        settings: staging.stagedSettings,
        sections: staging.stagedSections,
      },
    );
    staging.issues = report.issues as unknown as Array<Record<string, unknown>>;
    await this.stagings.save(staging);
    return { staging, report };
  }

  /** Merchant fixes staged settings against the TARGET version's schema. */
  async updateStagedSettings(
    installId: string,
    tenantId: string,
    settings: Record<string, unknown>,
  ) {
    const staging = await this.getStaging(installId, tenantId);
    staging.stagedSettings = settings;
    await this.stagings.save(staging);
    return this.refreshStagingIssues(staging);
  }

  async updateStagedSections(
    installId: string,
    tenantId: string,
    sections: Array<Record<string, unknown>>,
  ) {
    const staging = await this.getStaging(installId, tenantId);
    staging.stagedSections = sections;
    await this.stagings.save(staging);
    return this.refreshStagingIssues(staging);
  }

  private async latestSnapshot(
    installId: string,
  ): Promise<PublishedSnapshot | null> {
    const all = await this.snapshots.find({
      where: { installId },
      order: { publishedAt: 'DESC' },
    });
    return all[0] ?? null;
  }

  /**
   * Core state transition shared by manual apply, auto-apply and rollback:
   * backup current live state → switch version → store new settings →
   * publish snapshot. Backup is immutable, so nothing is ever lost.
   */
  private async performApply(opts: {
    install: ThemeInstall;
    target: ThemeVersion;
    settings: Record<string, unknown>;
    sections: Array<Record<string, unknown>>;
    label: string;
  }): Promise<PublishedSnapshot> {
    const live = await this.latestSnapshot(opts.install.id);
    const draft = await this.customizer.getOrCreateDraft(opts.install.id);

    await this.snapshots.save(
      this.snapshots.create({
        installId: opts.install.id,
        versionId: opts.install.activeVersionId,
        settings: live?.settings ?? draft.settings,
        sections: live?.sections ?? draft.sections,
        label: `Backup before ${opts.label}`,
      }),
    );

    opts.install.activeVersionId = opts.target.id;
    await this.installs.save(opts.install);

    draft.settings = opts.settings;
    draft.sections = opts.sections;
    await this.drafts.save(draft);

    return this.snapshots.save(
      this.snapshots.create({
        installId: opts.install.id,
        versionId: opts.target.id,
        settings: opts.settings,
        sections: opts.sections,
        label: opts.label,
      }),
    );
  }

  /** Merchant approves the staged update (spec §9 steps 6–10). */
  async applyStaged(installId: string, tenantId: string) {
    const install = await this.marketplace.findInstall(installId, tenantId);
    const staging = await this.stagings.findOne({
      where: { installId: install.id },
    });
    if (!staging) throw new NotFoundException('No staged update to apply');

    const report = await this.checkCompatibility(
      install,
      staging.targetVersionId,
      {
        settings: staging.stagedSettings,
        sections: staging.stagedSections,
      },
    );
    if (!report.compatible) {
      throw new ConflictException(
        `Cannot apply: ${report.issues.length} compatibility issue(s) remain. ` +
          `Fix them in staging first.`,
      );
    }

    const target = await this.themes.getVersionById(staging.targetVersionId);
    const snapshot = await this.performApply({
      install,
      target,
      settings: staging.stagedSettings,
      sections: staging.stagedSections,
      label: `Updated to v${target.version}`,
    });
    await this.stagings.remove(staging);
    return { snapshot, report };
  }

  async listSnapshots(installId: string, tenantId: string) {
    const install = await this.marketplace.findInstall(installId, tenantId);
    const snapshots = await this.snapshots.find({
      where: { installId: install.id },
      order: { publishedAt: 'DESC' },
    });
    const out = [];
    for (const s of snapshots) {
      const v = await this.themes.getVersionById(s.versionId);
      out.push({
        id: s.id,
        version: v.version,
        label: s.label,
        publishedAt: s.publishedAt,
      });
    }
    return out;
  }

  /** One-click rollback to any previous snapshot (spec §9). */
  async rollback(installId: string, tenantId: string, snapshotId: string) {
    const install = await this.marketplace.findInstall(installId, tenantId);
    const snapshot = await this.snapshots.findOne({
      where: { id: snapshotId },
    });
    if (!snapshot || snapshot.installId !== install.id) {
      throw new NotFoundException('Snapshot not found');
    }
    const target = await this.themes.getVersionById(snapshot.versionId);
    // Discard any staging — rollback wins.
    const staging = await this.stagings.findOne({
      where: { installId: install.id },
    });
    if (staging) await this.stagings.remove(staging);

    return this.performApply({
      install,
      target,
      settings: snapshot.settings,
      sections: snapshot.sections,
      label: `Rollback to v${target.version}`,
    });
  }

  /**
   * Executes the automatic update policy: for every install with policy
   * 'auto', applies the latest published version ONLY when fully
   * compatible. Incompatible installs are skipped with reasons —
   * never force-updated (spec: updates must never silently break stores).
   */
  async autoApplyAll() {
    const installs = await this.installs.find({
      where: { autoUpdatePolicy: 'auto' },
    });
    const applied: Array<Record<string, string>> = [];
    const skipped: Array<Record<string, string>> = [];

    for (const install of installs) {
      try {
        const theme = await this.themes.getThemeById(install.themeId);
        const current = await this.themes.getVersionById(
          install.activeVersionId,
        );
        const newer = (await this.themes.listVersions(theme.id))
          .filter(
            (v) =>
              v.status === 'published' &&
              semverCmp(v.version, current.version) > 0,
          )
          .sort((a, b) => semverCmp(b.version, a.version));
        if (newer.length === 0) continue;

        const target = newer[0];
        const draft = await this.customizer.getOrCreateDraft(install.id);
        const report = await this.checkCompatibility(install, target.id);
        if (!report.compatible) {
          skipped.push({
            installId: install.id,
            reason: `${report.issues.length} compatibility issue(s)`,
          });
          continue;
        }
        await this.performApply({
          install,
          target,
          settings: draft.settings,
          sections: draft.sections,
          label: `Auto-updated to v${target.version}`,
        });
        applied.push({ installId: install.id, version: target.version });
      } catch (e) {
        skipped.push({
          installId: install.id,
          reason: (e as Error).message,
        });
      }
    }
    return { applied, skipped };
  }
}
