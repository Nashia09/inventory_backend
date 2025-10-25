import { Controller, Get, Param, Post, Body, UseGuards, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreditPaymentsService } from './credit-payments.service';
import { CreateCreditPaymentDto } from './dto/create-credit-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@ApiTags('credit-payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers/:customerId/payments')
export class CreditPaymentsController {
  constructor(private readonly creditPaymentsService: CreditPaymentsService) {}

  @Post()
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  @ApiResponse({ status: 201, description: 'Credit payment recorded successfully' })
  async create(@Param('customerId') customerId: string, @Body() dto: CreateCreditPaymentDto, @Req() req: any) {
    const recordedBy = req.user?.userId;
    const payment = await this.creditPaymentsService.createForCustomer(customerId, dto, recordedBy);
    return { payment };
  }

  @Get()
  @Roles(Role.Cashier, Role.Manager, Role.Admin)
  async findAll(
    @Param('customerId') customerId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const p = parseInt(page as any, 10) || 1;
    const l = parseInt(limit as any, 10) || 50;
    return this.creditPaymentsService.findByCustomer(customerId, p, l);
  }
}