import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Staging area for a pending theme update (spec §9).
 * The merchant reviews the compatibility report, optionally fixes settings
 * against the TARGET version's schema, then approves. Nothing here touches
 * the live storefront until apply().
 */
@Entity('update_stagings')
export class UpdateStaging {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'install_id', type: 'uuid', unique: true })
  installId!: string;

  @Column({ name: 'target_version_id', type: 'uuid' })
  targetVersionId!: string;

  @Column({ name: 'staged_settings', type: 'jsonb', default: {} })
  stagedSettings!: Record<string, unknown>;

  @Column({ name: 'staged_sections', type: 'jsonb', default: [] })
  stagedSections!: Array<Record<string, unknown>>;

  /** Last computed compatibility issues (see UpdatesService.checkCompatibility). */
  @Column({ type: 'jsonb', default: [] })
  issues!: Array<Record<string, unknown>>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
