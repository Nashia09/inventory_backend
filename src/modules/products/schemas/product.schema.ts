import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  sku: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop()
  description?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);