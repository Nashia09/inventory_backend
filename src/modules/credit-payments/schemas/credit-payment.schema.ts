import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CreditPaymentDocument = CreditPayment & Document;

@Schema({ timestamps: true })
export class CreditPayment {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0.01 })
  amount: number;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: String })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;
}

export const CreditPaymentSchema = SchemaFactory.createForClass(CreditPayment);