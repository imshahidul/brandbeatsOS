import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type AutoUpdatePolicy = 'manual' | 'auto';

/**
 * A theme installed by a merchant (tenant). Points at the ACTIVE version;
 * switching versions never touches the merchant's customizations
 * (those live in merchant_theme_settings, Phase 4/5).
 */
@Entity('theme_installs')
@Unique(['tenantId', 'themeId'])
export class ThemeInstall {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'theme_id', type: 'uuid' })
  themeId!: string;

  @Column({ name: 'active_version_id', type: 'uuid' })
  activeVersionId!: string;

  @Column({ name: 'auto_update_policy', default: 'manual' })
  autoUpdatePolicy!: AutoUpdatePolicy;

  @CreateDateColumn({ name: 'installed_at' })
  installedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
