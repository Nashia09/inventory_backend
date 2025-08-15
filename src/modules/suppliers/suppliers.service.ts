import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(@InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>) {}

  async create(dto: Partial<Supplier>): Promise<Supplier> {
    return new this.supplierModel(dto).save();
  }

  async findAll(): Promise<Supplier[]> {
    return this.supplierModel.find().sort({ name: 1 });
  }

  async findOne(id: string): Promise<Supplier> {
    const item = await this.supplierModel.findById(id);
    if (!item) throw new NotFoundException('Supplier not found');
    return item;
  }

  async update(id: string, dto: Partial<Supplier>): Promise<Supplier> {
    const updated = await this.supplierModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Supplier not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.supplierModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Supplier not found');
  }
}