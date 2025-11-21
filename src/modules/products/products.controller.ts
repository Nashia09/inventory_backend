import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';
import { NotFoundException } from '@nestjs/common';

@ApiTags('products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private toClientProduct(p: any) {
    if (!p) return p;
    const o = typeof p.toObject === 'function' ? p.toObject() : p;
    return {
      _id: o._id,
      name: o.name,
      sku: o.sku,
      barcode: o.barcode,
      price: o.price,
      cost: o.cost,
      stock_quantity: o.stockQuantity,
      min_stock_level: o.minStockLevel,
      description: o.description,
      categoryId: o.categoryId,
      supplierId: o.supplierId,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  private normalizeIncomingDto(dto: any): any {
    const normalized: any = { ...dto };
    if (normalized.stockQuantity === undefined) {
      if (normalized.stock_quantity !== undefined) normalized.stockQuantity = normalized.stock_quantity;
      else if (normalized.quantity !== undefined) normalized.stockQuantity = normalized.quantity;
    }
    if (normalized.minStockLevel === undefined && normalized.min_stock_level !== undefined) {
      normalized.minStockLevel = normalized.min_stock_level;
    }
    return normalized;
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  create(@Body() createProductDto: CreateProductDto) {
    const payload = this.normalizeIncomingDto(createProductDto);
    return this.productsService.create(payload).then((p) => this.toClientProduct(p));
  }

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Cashier)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  findAll(@Query() query: any) {
    return this.productsService.findAll(query).then((res) => ({
      total: res.total,
      data: res.data.map((p) => this.toClientProduct(p)),
    }));
  }

  @Get('barcode/:barcode')
  @Roles(Role.Admin, Role.Manager, Role.Cashier)
  async findByBarcode(@Param('barcode') barcode: string) {
    const product = await this.productsService.findByBarcode(barcode);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return { product: this.toClientProduct(product) };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Manager, Role.Cashier)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id).then((p) => this.toClientProduct(p));
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Manager)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const payload = this.normalizeIncomingDto(updateProductDto);
    return this.productsService.update(id, payload).then((p) => this.toClientProduct(p));
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager)
  updatePut(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const payload = this.normalizeIncomingDto(updateProductDto);
    return this.productsService.update(id, payload).then((p) => this.toClientProduct(p));
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}