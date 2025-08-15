import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async create(dto: Partial<Category>): Promise<Category> {
    const created = new this.categoryModel(dto);
    return created.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().sort({ name: 1 });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: Partial<Category>): Promise<Category> {
    const updated = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.categoryModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Category not found');
  }
}