import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Manager)
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user as User;
  }

  @Post()
  @Roles(Role.Admin)
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    const { password, ...rest } = dto as any;
    const updated = await this.usersService.update(id, rest as Partial<User>);
    if (!updated) {
      throw new Error('User not found');
    }
    return updated as User;
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string, @Req() req: Request): Promise<{ message: string }> {
    const currentUserId = (req as any).user?.userId;
    if (id === currentUserId) {
      throw new Error('Cannot delete your own account');
    }
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}