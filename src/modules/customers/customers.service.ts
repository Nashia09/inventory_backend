import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private customerModel: Model<CustomerDocument>) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const created = new this.customerModel({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      creditLimit: dto.creditLimit ?? 0,
    });
    return created.save();
  }

  async findAll(options: { search?: string; page?: number; limit?: number } = {}): Promise<{ data: Customer[]; total: number }> {
    const { search, page = 1, limit = 50 } = options;
    const query: FilterQuery<CustomerDocument> = { isActive: true } as any;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.customerModel
        .find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.customerModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async search(q: string): Promise<Customer[]> {
    if (!q || q.length < 2) return [];
    return this.customerModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      })
      .sort({ name: 1 })
      .limit(10);
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customerModel.findById(id);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const updated = await this.customerModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Customer not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.customerModel.findByIdAndUpdate(id, { isActive: false });
    if (!res) throw new NotFoundException('Customer not found');
  }

  // Added: credit summary aggregation
  async creditSummary(): Promise<{ totalOutstanding: number; overdueCredits: number }> {
    const result = await this.customerModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalOutstanding: { $sum: '$outstandingBalance' } } },
    ]);
    const totalOutstanding = result[0]?.totalOutstanding || 0;
    return { totalOutstanding, overdueCredits: 0 };
  }
}