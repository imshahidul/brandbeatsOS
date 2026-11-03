import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { TenantMember, TenantRole } from './tenant-member.entity';
import { randomBytes } from 'crypto';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'store'
  );
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
    @InjectRepository(TenantMember)
    private readonly members: Repository<TenantMember>,
  ) {}

  /** Creates a tenant and makes the user its merchant_admin. */
  async create(
    userId: string,
    data: { name: string; slug?: string },
  ): Promise<Tenant> {
    const base = slugify(data.slug ?? data.name);
    const slug = `${base}-${randomBytes(3).toString('hex')}`;

    const existing = await this.tenants.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Tenant slug already taken');

    const tenant = await this.tenants.save(
      this.tenants.create({ name: data.name.trim(), slug }),
    );
    await this.members.save(
      this.members.create({ tenantId: tenant.id, userId, role: 'merchant_admin' }),
    );
    return tenant;
  }

  async listForUser(userId: string): Promise<(Tenant & { role: TenantRole })[]> {    const memberships = await this.members.find({ where: { userId } });
    if (memberships.length === 0) return [];
    const tenants = await this.tenants.findBy({
      id: In(memberships.map((m) => m.tenantId)),
    });
    const roleByTenant = new Map(memberships.map((m) => [m.tenantId, m.role]));
    return tenants.map((t) => ({ ...t, role: roleByTenant.get(t.id)! }));
  }

  /** Platform-wide tenant list (platform_admin only). */
  async listAll(): Promise<Tenant[]> {
    return this.tenants.find({ order: { createdAt: 'DESC' } });
  }

  findMembership(
    tenantId: string,
    userId: string,
  ): Promise<TenantMember | null> {
    return this.members.findOne({ where: { tenantId, userId } });
  }

  async getTenant(id: string): Promise<Tenant> {
    const tenant = await this.tenants.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  /**
   * Updates white-label branding (store name, logo, favicon).
   * Tenant-level: persists across theme installs/switches/updates.
   */
  async updateBranding(
    tenantId: string,
    dto: { name?: string; logoUrl?: string | null; faviconUrl?: string | null },
  ): Promise<Tenant> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.name !== undefined) tenant.name = dto.name.trim();
    if (dto.logoUrl !== undefined) tenant.logoUrl = dto.logoUrl;
    if (dto.faviconUrl !== undefined) tenant.faviconUrl = dto.faviconUrl;

    return this.tenants.save(tenant);
  }
}
