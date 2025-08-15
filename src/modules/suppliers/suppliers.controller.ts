import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.Admin, Role.Manager)
  create(@Body() dto: any) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager)
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Manager)
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Manager)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}