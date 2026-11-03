import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Merchant product catalog (storefront data).
 *
 * Tenant-scoped: every query is filtered by tenantId (TenantGuard).
 * The storefront preview embeds active products in the preview document
 * so product rails render real merchant data.
 */
@Entity('products')
@Index('IDX_products_tenant', ['tenantId'])
@Index('IDX_products_tenant_collection', ['tenantId', 'collection'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column()
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Price in major currency units (e.g. 1299.50). */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price!: string;

  @Column({ default: 'BDT' })
  currency!: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ default: 'all' })
  collection!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
