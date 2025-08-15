import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  Admin = 'admin',
  Manager = 'manager',
  Cashier = 'cashier',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: Role, default: Role.Cashier })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);