import { Controller, Get, Param, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@ApiTags('stock-movements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products/:productId/movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  @Roles(Role.Manager, Role.Admin)
  @ApiResponse({ status: 201, description: 'Stock movement recorded successfully' })
  async create(@Param('productId') productId: string, @Body() dto: CreateStockMovementDto, @Req() req: any) {
    const recordedBy = req.user?.userId;
    const movement = await this.stockMovementsService.createForProduct(productId, dto, recordedBy);
    return { movement };
  }

  @Get()
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  async findAll(
    @Param('productId') productId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const p = parseInt(page as any, 10) || 1;
    const l = parseInt(limit as any, 10) || 50;
    return this.stockMovementsService.listForProduct(productId, p, l);
  }
}