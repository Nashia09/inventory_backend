import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { Role, User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const hash = await bcrypt.hash(dto.password, 10);
    const created = new this.userModel({ ...dto, password: hash, role: dto.role || Role.Cashier });
    return created.save();
  }

  async findByEmail(email: string, withPassword = false): Promise<UserDocument | null> {
    if (withPassword) {
      return this.userModel.findOne({ email }).select('+password');
    }
    return this.userModel.findOne({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async update(id: string, update: Partial<User>): Promise<User | null> {
    const updated = await this.userModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('User not found');
  }
}