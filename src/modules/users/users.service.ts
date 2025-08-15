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
}