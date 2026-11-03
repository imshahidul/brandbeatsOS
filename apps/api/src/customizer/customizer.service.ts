import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  validateSectionLayout,
  validateSettings,
  type ThemeManifest,
} from '@brand-beats/theme-sdk';
import { ThemesService } from '../themes/themes.service';
import { ThemeVersion } from '../themes/theme-version.entity';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { ThemeInstall } from '../marketplace/theme-install.entity';
import { TenantsService } from '../tenants/tenants.service';
import { ProductsService } from '../products/products.service';
import { MerchantThemeSettings } from './merchant-theme-settings.entity';
import { PublishedSnapshot } from './published-snapshot.entity';
import { SectionInstanceDto } from './dto/customizer.dto';

interface ActiveContext {
  install: ThemeInstall;
  version: ThemeVersion;
  manifest: ThemeManifest;
  draft: MerchantThemeSettings;
}

@Injectable()
export class CustomizerService {
  constructor(
    private readonly themes: ThemesService,
    private readonly marketplace: MarketplaceService,
    private readonly tenants: TenantsService,
    private readonly products: ProductsService,
    @InjectRepository(MerchantThemeSettings)
    private readonly drafts: Repository<MerchantThemeSettings>,
    @InjectRepository(PublishedSnapshot)
    private readonly snapshots: Repository<PublishedSnapshot>,
  ) {}

  private async context(
    installId: string,
    tenantId: string,
  ): Promise<ActiveContext> {
    // findInstall enforces tenant isolation.
    const install = await this.marketplace.findInstall(installId, tenantId);
    const version = await this.themes.getVersionById(install.activeVersionId);
    if (version.status !== 'published') {
      throw new BadRequestException('Active theme version is not published');
    }

    const draft = await this.getOrCreateDraft(installId);

    return {
      install,
      version,
      manifest: version.manifest as unknown as ThemeManifest,
      draft,
    };
  }

  /** Shared with UpdatesService (staging builds on the same draft). */
  async getOrCreateDraft(installId: string): Promise<MerchantThemeSettings> {
    let draft = await this.drafts.findOne({ where: { installId } });
    if (!draft) {
      draft = await this.drafts.save(
        this.drafts.create({ installId, settings: {}, sections: [] }),
      );
    }
    return draft;
  }

  /** Draft + everything the customizer UI needs to render controls. */
  async getDraft(installId: string, tenantId: string) {
    const { install, version, manifest, draft } = await this.context(
      installId,
      tenantId,
    );
    return {
      install: {
        id: install.id,
        themeId: install.themeId,
        activeVersion: version.version,
      },
      settings: draft.settings,
      sections: draft.sections,
      configSchema: version.configSchema,
      sectionsAvailable: manifest.sections.map((s) => ({
        type: s.type,
        name: s.name,
        description: s.description,
        maxInstances: s.maxInstances ?? null,
        defaultSettings: s.defaultSettings,
      })),
      updatedAt: draft.updatedAt,
    };
  }

  /** Saves theme settings (colors, buttons, text, …) after SDK validation. */
  async saveSettings(
    installId: string,
    tenantId: string,
    settings: Record<string, unknown>,
  ): Promise<MerchantThemeSettings> {
    const { version, draft } = await this.context(installId, tenantId);
    const checked = validateSettings(
      version.configSchema as Record<string, unknown>,
      settings,
    );
    if (!checked.ok) {
      throw new BadRequestException(
        `Invalid theme settings: ${checked.errors.join('; ')}`,
      );
    }
    draft.settings = settings;
    return this.drafts.save(draft);
  }

  private assertSectionsValid(
    manifest: ThemeManifest,
    sections: SectionInstanceDto[],
  ): void {
    const checked = validateSectionLayout(manifest, sections);
    if (!checked.ok) {
      throw new BadRequestException(
        `Invalid sections: ${checked.errors.join('; ')}`,
      );
    }
  }

  /** Replaces the homepage-builder layout (order = render order). */
  async saveSections(
    installId: string,
    tenantId: string,
    sections: SectionInstanceDto[],
  ): Promise<MerchantThemeSettings> {
    const { manifest, draft } = await this.context(installId, tenantId);
    this.assertSectionsValid(manifest, sections);
    draft.sections = sections as unknown as Array<Record<string, unknown>>;
    return this.drafts.save(draft);
  }

  /**
   * Publishes the draft: full re-validation, then an immutable snapshot.
   * The live storefront renders from the latest snapshot, never the draft.
   */
  async publish(
    installId: string,
    tenantId: string,
  ): Promise<PublishedSnapshot> {
    const { install, version, manifest, draft } = await this.context(
      installId,
      tenantId,
    );

    const settingsCheck = validateSettings(
      version.configSchema as Record<string, unknown>,
      draft.settings,
    );
    if (!settingsCheck.ok) {
      throw new BadRequestException(
        `Cannot publish: settings invalid: ${settingsCheck.errors.join('; ')}`,
      );
    }
    this.assertSectionsValid(
      manifest,
      draft.sections as unknown as SectionInstanceDto[],
    );

    return this.snapshots.save(
      this.snapshots.create({
        installId: install.id,
        versionId: version.id,
        settings: draft.settings,
        sections: draft.sections,
      }),
    );
  }

  /** Latest published snapshot (what the storefront actually renders). */
  async getPublished(installId: string, tenantId: string) {
    const install = await this.marketplace.findInstall(installId, tenantId);
    const snapshots = await this.snapshots.find({
      where: { installId: install.id },
      order: { publishedAt: 'DESC' },
    });
    const latest = snapshots[0];
    if (!latest) throw new NotFoundException('Nothing published yet');
    return latest;
  }

  /**
   * Assembles the storefront document for the sandboxed renderer:
   * tenant white-label branding + theme + validated settings + sections.
   * (Spec §11 — live preview.)
   */
  async getPreview(installId: string, tenantId: string) {
    const { install, version, draft } = await this.context(
      installId,
      tenantId,
    );
    const tenant = await this.tenants.getTenant(install.tenantId);
    const theme = await this.themes.getThemeById(install.themeId);

    return {
      branding: {
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        faviconUrl: tenant.faviconUrl,
      },
      theme: { slug: theme.slug, name: theme.name, version: version.version },
      settings: draft.settings,
      // Renderer skips hidden sections; order is significant.
      sections: (draft.sections as unknown as SectionInstanceDto[]).filter(
        (s) => !s.hidden,
      ),
      // Active products for product rails / showcases (real merchant data).
      products: (await this.products.listActive(install.tenantId)).map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        imageUrl: p.imageUrl,
        collection: p.collection,
      })),
    };
  }
}
