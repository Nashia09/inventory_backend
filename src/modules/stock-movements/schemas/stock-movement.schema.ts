import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

export enum StockMovementType {
  In = 'in',
  Out = 'out',
  Adjustment = 'adjustment',
}

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, enum: StockMovementType })
  type: StockMovementType;

  // For 'in'/'out' movements: quantity moved
  @Prop({ type: Number, min: 0 })
  quantity?: number;

  // For 'adjustment' movements: absolute new quantity
  @Prop({ type: Number, min: 0 })
  newQuantity?: number;

  @Prop({ type: Number, min: 0 })
  previousQuantity: number;

  @Prop({ type: Number, min: 0 })
  resultingQuantity: number;

  @Prop({ type: String })
  reason?: string;

  @Prop({ type: String })
  referenceType?: string; // 'sale', 'purchase', 'adjustment'

  @Prop({ type: String })
  referenceId?: string; // saleId, purchaseId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: String })
  notes?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);