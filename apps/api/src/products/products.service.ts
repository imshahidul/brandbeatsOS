import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { randomBytes } from 'crypto';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '') // U+0300–U+036F combining diacritical marks
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `product-${randomBytes(3).toString('hex')}`
  );
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async create(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.products.create({
      tenantId,
      name: dto.name.trim(),
      slug: dto.slug?.trim() || `${slugify(dto.name)}-${randomBytes(3).toString('hex')}`,
      description: dto.description?.trim() ?? null,
      price: String(dto.price ?? 0),
      currency: (dto.currency ?? 'BDT').toUpperCase(),
      imageUrl: dto.imageUrl ?? null,
      collection: (dto.collection ?? 'all').trim().toLowerCase() || 'all',
      isActive: dto.isActive ?? true,
    });
    return this.products.save(product);
  }

  /** Active products for storefront rendering, optionally filtered by collection. */
  async listActive(tenantId: string, collection?: string): Promise<Product[]> {
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (collection && collection !== 'all') where.collection = collection;
    return this.products.find({ where, order: { createdAt: 'DESC' } });
  }

  async listAll(tenantId: string): Promise<Product[]> {
    return this.products.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.products.findOne({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Product not found');
    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.description !== undefined) product.description = dto.description?.trim() ?? null;
    if (dto.price !== undefined) product.price = String(dto.price);
    if (dto.currency !== undefined) product.currency = dto.currency.toUpperCase();
    if (dto.imageUrl !== undefined) product.imageUrl = dto.imageUrl;
    if (dto.collection !== undefined)
      product.collection = dto.collection.trim().toLowerCase() || 'all';
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    return this.products.save(product);
  }

  async remove(tenantId: string, id: string): Promise<{ deleted: true }> {
    const product = await this.products.findOne({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Product not found');
    await this.products.remove(product);
    return { deleted: true };
  }
}
