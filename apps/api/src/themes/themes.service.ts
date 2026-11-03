import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  validateManifest,
  type ThemeManifest,
} from '@brand-beats/theme-sdk';
import { Theme } from './theme.entity';
import { ThemeVersion } from './theme-version.entity';
import { PublishVersionDto } from './dto/theme.dto';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(Theme) private readonly themes: Repository<Theme>,
    @InjectRepository(ThemeVersion)
    private readonly versions: Repository<ThemeVersion>,
  ) {}

  async createTheme(data: { slug: string; name: string }): Promise<Theme> {
    const slug = data.slug.toLowerCase().trim();
    if (!SLUG_RE.test(slug)) {
      throw new BadRequestException(
        'Invalid slug (lowercase letters, numbers, hyphens only)',
      );
    }
    const existing = await this.themes.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Theme slug already taken');

    return this.themes.save(
      this.themes.create({
        slug,
        name: data.name.trim(),
        visibility: 'private',
        monetization: 'free',
      }),
    );
  }

  /**
   * Publishes an immutable theme version. The manifest is validated by the
   * Theme SDK; versions can never be edited or re-published (spec §8).
   */
  async publishVersion(
    themeId: string,
    dto: PublishVersionDto,
  ): Promise<ThemeVersion> {
    const theme = await this.themes.findOne({ where: { id: themeId } });
    if (!theme) throw new NotFoundException('Theme not found');

    const checked = validateManifest(dto.manifest);
    if (!checked.ok) {
      throw new BadRequestException(
        `Invalid theme manifest: ${checked.errors.join('; ')}`,
      );
    }
    const manifest = dto.manifest as unknown as ThemeManifest;

    if (manifest.id !== theme.slug) {
      throw new BadRequestException('Manifest id must match the theme slug');
    }
    if (manifest.version !== dto.version) {
      throw new BadRequestException('Version must match manifest.version');
    }

    const duplicate = await this.versions.findOne({
      where: { themeId, version: dto.version },
    });
    if (duplicate) {
      throw new ConflictException(
        'Version already published (versions are immutable)',
      );
    }

    return this.versions.save(
      this.versions.create({
        themeId,
        version: dto.version,
        manifest: dto.manifest,
        configSchema: dto.configSchema,
        packageUrl: dto.packageUrl ?? null,
        changelog: dto.changelog ?? '',
        minPlatformVersion: manifest.minPlatformVersion,
        status: 'published',
      }),
    );
  }

  getThemeBySlug(slug: string): Promise<Theme | null> {
    return this.themes.findOne({ where: { slug } });
  }

  async getThemeById(id: string): Promise<Theme> {
    const theme = await this.themes.findOne({ where: { id } });
    if (!theme) throw new NotFoundException('Theme not found');
    return theme;
  }

  async listAllThemes(): Promise<Theme[]> {
    return this.themes.find({ order: { createdAt: 'DESC' } });
  }

  async getVersionById(id: string): Promise<ThemeVersion> {
    const version = await this.versions.findOne({ where: { id } });
    if (!version) throw new NotFoundException('Theme version not found');
    return version;
  }

  async updateTheme(
    id: string,
    dto: { visibility?: string; monetization?: string },
  ): Promise<Theme> {
    const theme = await this.getThemeById(id);
    if (dto.visibility !== undefined) {
      if (!['public', 'private', 'deprecated'].includes(dto.visibility)) {
        throw new BadRequestException('Invalid visibility');
      }
      theme.visibility = dto.visibility as Theme['visibility'];
    }
    if (dto.monetization !== undefined) {
      theme.monetization = dto.monetization;
    }
    return this.themes.save(theme);
  }

  listVersions(themeId: string): Promise<ThemeVersion[]> {
    return this.versions.find({
      where: { themeId },
      order: { createdAt: 'DESC' },
    });
  }
}
