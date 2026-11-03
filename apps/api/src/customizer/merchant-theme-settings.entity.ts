import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Merchant's draft customization for one theme install (spec §5, §10).
 * Stored SEPARATELY from the theme package — theme updates migrate these
 * settings instead of overwriting them. Drafts are unpublished until the
 * merchant explicitly publishes (→ published_snapshots).
 */
@Entity('merchant_theme_settings')
export class MerchantThemeSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'install_id', type: 'uuid', unique: true })
  installId!: string;

  /** Validated against the active theme version's config.schema.json. */
  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;

  /** Ordered homepage section instances (the homepage builder layout). */
  @Column({ type: 'jsonb', default: [] })
  sections!: Array<Record<string, unknown>>;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
