import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale, SaleDocument } from './schemas/sale.schema';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    private productsService: ProductsService,
  ) {}

  async create(dto: CreateSaleDto, cashier: { userId: string; email: string; role: string; name?: string }) {
    if (!dto.productsSold || dto.productsSold.length === 0) {
      throw new BadRequestException('No products provided');
    }

    // Validate stock and calculate totals
    const productDocs = await Promise.all(
      dto.productsSold.map((item) => this.productsService.findOne(item.productId)),
    );

    let totalAmount = 0;

    for (let i = 0; i < dto.productsSold.length; i++) {
      const item = dto.productsSold[i];
      const product = productDocs[i];
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }
      totalAmount += item.unitPrice * item.quantity;
    }

    // Deduct stock
    await Promise.all(
      dto.productsSold.map((item) =>
        this.productsService.update(item.productId, {
          stockQuantity:
            (productDocs.find((p) => (p as any)._id?.toString() === item.productId)?.stockQuantity || 0) -
            item.quantity,
        }),
      ),
    );

    const sale = new this.saleModel({
      productsSold: dto.productsSold.map((p) => ({
        productId: new Types.ObjectId(p.productId),
        productName: p.productName,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.quantity * p.unitPrice,
      })),
      totalAmount,
      cashierId: new Types.ObjectId(cashier.userId),
      cashierName: cashier.name || cashier.email,
    });

    return sale.save();
  }

  async findAll(query: any) {
    const { page = 1, limit = 10 } = query;
    const [data, total] = await Promise.all([
      this.saleModel
        .find()
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      this.saleModel.countDocuments(),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const sale = await this.saleModel.findById(id);
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  // Added: dashboard stats for today
  async todayStatsForUser(user: { userId: string; role: string }) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    const filter: any = { createdAt: { $gte: start, $lte: end } };
    if (user?.role === 'Cashier') {
      filter.cashierId = new Types.ObjectId(user.userId);
    }
    const sales = await this.saleModel.find(filter).lean();
    const transactions = sales.length;
    const revenue = sales.reduce((sum, s: any) => sum + (s.totalAmount || 0), 0);
    return { transactions, revenue };
  }

  // Added: recent sales list
  async recentForUser(user: { userId: string; role: string }, limit = 5) {
    const filter: any = {};
    if (user?.role === 'Cashier') {
      filter.cashierId = new Types.ObjectId(user.userId);
    }
    const sales = await this.saleModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    const recentSales = sales.map((s: any) => ({
      id: String(s._id),
      transaction_id: String(s._id).slice(-6),
      created_at: s.createdAt,
      item_count: (s.productsSold || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
      total_amount: s.totalAmount || 0,
    }));
    return { recentSales };
  }
}