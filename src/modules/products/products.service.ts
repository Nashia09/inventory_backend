import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const created = new this.productModel(dto);
    return created.save();
  }

  async findAll(query: any): Promise<{ data: Product[]; total: number }> {
    const { page = 1, limit = 10, search, categoryId, supplierId } = query;
    const filter: any = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (categoryId) filter.categoryId = categoryId;
    if (supplierId) filter.supplierId = supplierId;

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      this.productModel.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const updated = await this.productModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.productModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Product not found');
  }
}