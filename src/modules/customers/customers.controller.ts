import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@ApiTags('customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  async findAll(@Query('search') search?: string, @Query('page') page = '1', @Query('limit') limit = '50') {
    const p = parseInt(page as any, 10) || 1;
    const l = parseInt(limit as any, 10) || 50;
    return this.customersService.findAll({ search, page: p, limit: l });
  }

  @Get('credit/summary')
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  async creditSummary() {
    return this.customersService.creditSummary();
  }

  @Get('search')
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  async search(@Query('q') q: string) {
    const customers = await this.customersService.search(q);
    return { customers };
  }

  @Get(':id')
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.Manager, Role.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string) {
    await this.customersService.remove(id);
    return { message: 'Customer deactivated successfully' };
  }
}