import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type ThemeVersionStatus = 'draft' | 'published' | 'deprecated';

/**
 * Immutable theme versions (spec §8). Once published, a version row is never
 * mutated — updates are new rows. Merchant customizations live separately
 * and are migrated, never overwritten.
 */
@Entity('theme_versions')
@Unique(['themeId', 'version'])
export class ThemeVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'theme_id', type: 'uuid' })
  themeId!: string;

  /** Semver, e.g. "1.2.0". */
  @Column()
  version!: string;

  /** The validated theme.json manifest (frozen at publish time). */
  @Column({ type: 'jsonb' })
  manifest!: Record<string, unknown>;

  /** The validated config.schema.json (drives the customizer UI). */
  @Column({ name: 'config_schema', type: 'jsonb' })
  configSchema!: Record<string, unknown>;

  @Column({ name: 'package_url', type: 'text', nullable: true })
  packageUrl!: string | null;

  @Column({ type: 'text', default: '' })
  changelog!: string;

  @Column({ name: 'min_platform_version' })
  minPlatformVersion!: string;

  @Column({ default: 'draft' })
  status!: ThemeVersionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
