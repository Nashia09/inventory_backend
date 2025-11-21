import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  sku: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier' })
  supplierId?: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0, min: 0 })
  cost?: number;

  @Prop()
  barcode?: string;

  @Prop({ required: true, min: 0 })
  stockQuantity: number;

  @Prop({ default: 0, min: 0 })
  minStockLevel?: number;

  @Prop()
  description?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);