import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

@Schema({ _id: false })
export class ProductSold {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;
}

@Schema({ timestamps: true })
export class Sale {
  @Prop([ProductSold])
  productsSold: ProductSold[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cashierId: Types.ObjectId;

  @Prop({ required: true })
  cashierName: string;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);