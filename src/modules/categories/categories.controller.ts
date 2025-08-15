import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(Role.Admin, Role.Manager)
  create(@Body() dto: any) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Cashier)
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Manager, Role.Cashier)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Manager)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}