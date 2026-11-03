import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { TenantGuard } from '../common/guards/tenant.guard';

type TenantReq = { tenant: { id: string } };

/**
 * Merchant product catalog (storefront data).
 * Tenant-scoped via TenantGuard (X-Tenant-Id header + membership).
 */
@Controller('products')
@UseGuards(TenantGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  create(@Req() req: TenantReq, @Body() dto: CreateProductDto) {
    return this.products.create(req.tenant.id, dto);
  }

  /** All products (merchant management view). */
  @Get()
  list(@Req() req: TenantReq) {
    return this.products.listAll(req.tenant.id);
  }

  /** Active products, optionally filtered by collection (storefront use). */
  @Get('active')
  listActive(
    @Req() req: TenantReq,
    @Query('collection') collection?: string,
  ) {
    return this.products.listActive(req.tenant.id, collection);
  }

  @Patch(':id')
  update(
    @Req() req: TenantReq,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(req.tenant.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: TenantReq, @Param('id') id: string) {
    return this.products.remove(req.tenant.id, id);
  }
}
