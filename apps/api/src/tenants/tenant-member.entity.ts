import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type TenantRole = 'merchant_admin' | 'merchant';

@Entity('tenant_members')
@Unique(['tenantId', 'userId'])
export class TenantMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column()
  role!: TenantRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
