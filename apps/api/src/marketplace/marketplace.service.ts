import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ThemeManifest } from '@brand-beats/theme-sdk';
import { ThemesService } from '../themes/themes.service';
import { ThemeInstall } from './theme-install.entity';
import { ListThemesQuery } from './dto/marketplace.dto';

function semverCmp(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export interface MarketplaceThemeCard {
  id: string;
  slug: string;
  name: string;
  version: string;
  description?: string;
  categories: string[];
  styles: string[];
  presentationModes: string[];
  locales: string[];
  installed: boolean;
}

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly themes: ThemesService,
    @InjectRepository(ThemeInstall)
    private readonly installs: Repository<ThemeInstall>,
  ) {}

  /**
   * Browse public themes with search/filter. Only themes with at least one
   * published version appear. `installed` reflects the requesting tenant.
   */
  async listThemes(
    tenantId: string,
    query: ListThemesQuery,
  ): Promise<MarketplaceThemeCard[]> {
    const themes = (await this.themes.listAllThemes()).filter(
      (t) => t.visibility === 'public',
    );
    const installs = await this.installs.find({ where: { tenantId } });
    const installedThemeIds = new Set(installs.map((i) => i.themeId));

    const cards: MarketplaceThemeCard[] = [];
    for (const theme of themes) {
      const versions = (await this.themes.listVersions(theme.id)).filter(
        (v) => v.status === 'published',
      );
      if (versions.length === 0) continue;
      versions.sort((a, b) => semverCmp(b.version, a.version));
      const latest = versions[0];
      const manifest = latest.manifest as unknown as ThemeManifest;

      if (
        query.search &&
        !`${theme.name} ${theme.slug} ${manifest.description ?? ''}`
          .toLowerCase()
          .includes(query.search.toLowerCase())
      ) {
        continue;
      }
      if (query.category && !manifest.categories.includes(query.category)) continue;
      if (query.style && !manifest.styles.includes(query.style)) continue;
      if (
        query.presentationMode &&
        !manifest.presentationModes.includes(query.presentationMode as never)
      ) {
        continue;
      }

      cards.push({
        id: theme.id,
        slug: theme.slug,
        name: theme.name,
        version: latest.version,
        description: manifest.description,
        categories: manifest.categories,
        styles: manifest.styles,
        presentationModes: manifest.presentationModes,
        locales: manifest.locales,
        installed: installedThemeIds.has(theme.id),
      });
    }
    return cards;
  }

  async getThemeDetail(tenantId: string, slug: string) {
    const theme = await this.themes.getThemeBySlug(slug);
    if (!theme || theme.visibility !== 'public') {
      throw new NotFoundException('Theme not found');
    }
    const versions = (await this.themes.listVersions(theme.id))
      .filter((v) => v.status === 'published')
      .sort((a, b) => semverCmp(b.version, a.version));
    const install = await this.installs.findOne({
      where: { tenantId, themeId: theme.id },
    });
    return {
      id: theme.id,
      slug: theme.slug,
      name: theme.name,
      installed: !!install,
      activeVersionId: install?.activeVersionId ?? null,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        changelog: v.changelog,
        minPlatformVersion: v.minPlatformVersion,
        createdAt: v.createdAt,
        manifest: v.manifest,
      })),
    };
  }

  /** Installs the latest published version of a public theme for a tenant. */
  async installTheme(tenantId: string, slug: string): Promise<ThemeInstall> {
    const theme = await this.themes.getThemeBySlug(slug);
    if (!theme || theme.visibility !== 'public') {
      throw new NotFoundException('Theme not found');
    }
    const existing = await this.installs.findOne({
      where: { tenantId, themeId: theme.id },
    });
    if (existing) throw new ConflictException('Theme already installed');

    const versions = (await this.themes.listVersions(theme.id))
      .filter((v) => v.status === 'published')
      .sort((a, b) => semverCmp(b.version, a.version));
    if (versions.length === 0) {
      throw new BadRequestException('Theme has no published versions');
    }

    return this.installs.save(
      this.installs.create({
        tenantId,
        themeId: theme.id,
        activeVersionId: versions[0].id,
        autoUpdatePolicy: 'manual',
      }),
    );
  }

  /**
   * Fetches one install, enforcing tenant isolation.
   * Shared by the customizer and future modules.
   */
  async findInstall(installId: string, tenantId: string): Promise<ThemeInstall> {
    const install = await this.installs.findOne({
      where: { id: installId, tenantId },
    });
    if (!install) throw new NotFoundException('Install not found');
    return install;
  }

  async listInstalls(tenantId: string) {
    const installs = await this.installs.find({ where: { tenantId } });
    const out = [];
    for (const install of installs) {
      const theme = await this.themes.getThemeById(install.themeId);
      const versions = await this.themes.listVersions(theme.id);
      const active = versions.find((v) => v.id === install.activeVersionId);
      out.push({
        id: install.id,
        theme: { id: theme.id, slug: theme.slug, name: theme.name },
        activeVersion: active
          ? { id: active.id, version: active.version }
          : null,
        autoUpdatePolicy: install.autoUpdatePolicy,
        installedAt: install.installedAt,
      });
    }
    return out;
  }

  /** Switches an install to another published version of the same theme. */
  async switchVersion(
    installId: string,
    tenantId: string,
    versionId: string,
  ): Promise<ThemeInstall> {
    // tenantId in the where clause = tenant isolation (a tenant can never
    // touch another tenant's install).
    const install = await this.installs.findOne({
      where: { id: installId, tenantId },
    });
    if (!install) throw new NotFoundException('Install not found');

    const versions = await this.themes.listVersions(install.themeId);
    const target = versions.find(
      (v) => v.id === versionId && v.status === 'published',
    );
    if (!target) {
      throw new BadRequestException(
        'Version not found or not published for this theme',
      );
    }

    install.activeVersionId = target.id;
    return this.installs.save(install);
  }

  async setAutoUpdatePolicy(
    installId: string,
    tenantId: string,
    policy: 'manual' | 'auto',
  ): Promise<ThemeInstall> {
    const install = await this.installs.findOne({
      where: { id: installId, tenantId },
    });
    if (!install) throw new NotFoundException('Install not found');
    install.autoUpdatePolicy = policy;
    return this.installs.save(install);
  }

  async uninstall(installId: string, tenantId: string): Promise<{ ok: true }> {
    const install = await this.installs.findOne({
      where: { id: installId, tenantId },
    });
    if (!install) throw new NotFoundException('Install not found');
    await this.installs.remove(install);
    return { ok: true };
  }
}
