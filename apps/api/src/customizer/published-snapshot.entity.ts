import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Point-in-time published storefront state (spec §10).
 * Created on every publish; used as rollback targets (Phase 5)
 * and as the source of truth for storefront rendering.
 */
@Entity('published_snapshots')
export class PublishedSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'install_id', type: 'uuid' })
  installId!: string;

  @Column({ name: 'version_id', type: 'uuid' })
  versionId!: string;

  @Column({ type: 'jsonb' })
  settings!: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  sections!: Array<Record<string, unknown>>;

  /** Human label: 'publish' is default; 'backup …' / 'rollback …' for update flows. */
  @Column({ type: 'text', nullable: true })
  label!: string | null;

  @CreateDateColumn({ name: 'published_at' })
  publishedAt!: Date;
}
