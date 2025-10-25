import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.Admin, Role.Cashier)
  create(@Body() dto: CreateSaleDto, @Req() req: any) {
    return this.salesService.create(dto, req.user);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: any) {
    return this.salesService.findAll(query);
  }

  @Get('dashboard/today')
  @Roles(Role.Admin, Role.Manager, Role.Cashier)
  today(@Req() req: any) {
    return this.salesService.todayStatsForUser(req.user);
  }

  @Get('dashboard/recent')
  @Roles(Role.Admin, Role.Manager, Role.Cashier)
  recent(@Req() req: any) {
    return this.salesService.recentForUser(req.user);
  }
  @Get(':id')
  @Roles(Role.Admin, Role.Manager)
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}