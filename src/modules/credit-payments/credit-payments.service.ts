import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreditPayment, CreditPaymentDocument } from './schemas/credit-payment.schema';
import { CreateCreditPaymentDto } from './dto/create-credit-payment.dto';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';

@Injectable()
export class CreditPaymentsService {
  constructor(
    @InjectModel(CreditPayment.name) private creditPaymentModel: Model<CreditPaymentDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async createForCustomer(customerId: string, dto: CreateCreditPaymentDto, recordedBy: string): Promise<CreditPayment> {
    const customer = await this.customerModel.findById(customerId);
    if (!customer || !customer.isActive) {
      throw new NotFoundException('Customer not found or inactive');
    }

    const payment = await this.creditPaymentModel.create({
      customerId: new Types.ObjectId(customerId),
      amount: dto.amount,
      date: dto.date ? new Date(dto.date) : new Date(),
      note: dto.note,
      recordedBy: new Types.ObjectId(recordedBy),
    });

    const newBalance = Math.max(0, (customer.outstandingBalance || 0) - dto.amount);
    await this.customerModel.updateOne({ _id: customer._id }, { $set: { outstandingBalance: newBalance } });

    return payment;
  }

  async findByCustomer(customerId: string, page = 1, limit = 50) {
    const p = Math.max(1, page);
    const l = Math.max(1, Math.min(200, limit));
    const [items, total] = await Promise.all([
      this.creditPaymentModel
        .find({ customerId })
        .sort({ date: -1, createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      this.creditPaymentModel.countDocuments({ customerId }),
    ]);
    return { items, total, page: p, limit: l };
  }
}