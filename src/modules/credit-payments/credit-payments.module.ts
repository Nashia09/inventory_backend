import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreditPaymentsService } from './credit-payments.service';
import { CreditPaymentsController } from './credit-payments.controller';
import { CreditPayment, CreditPaymentSchema } from './schemas/credit-payment.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreditPayment.name, schema: CreditPaymentSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [CreditPaymentsController],
  providers: [CreditPaymentsService],
})
export class CreditPaymentsModule {}