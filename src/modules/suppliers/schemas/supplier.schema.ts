import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true })
  name: string;

  @Prop()
  contactInfo?: string;

  @Prop()
  address?: string;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);