import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockMovement, StockMovementDocument, StockMovementType } from './schemas/stock-movement.schema';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async createForProduct(productId: string, dto: CreateStockMovementDto, recordedBy: string): Promise<StockMovement> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const previous = product.stockQuantity || 0;
    let resulting = previous;

    if (dto.type === StockMovementType.In) {
      if (!dto.quantity || dto.quantity <= 0) throw new BadRequestException('Quantity must be positive for IN movement');
      resulting = previous + dto.quantity;
    } else if (dto.type === StockMovementType.Out) {
      if (!dto.quantity || dto.quantity <= 0) throw new BadRequestException('Quantity must be positive for OUT movement');
      if (dto.quantity > previous) throw new BadRequestException('Insufficient stock');
      resulting = previous - dto.quantity;
    } else if (dto.type === StockMovementType.Adjustment) {
      if (dto.newQuantity === undefined || dto.newQuantity < 0) {
        throw new BadRequestException('newQuantity must be provided for adjustment');
      }
      resulting = dto.newQuantity;
    } else {
      throw new BadRequestException('Invalid movement type');
    }

    // Persist movement
    const movement = await this.stockMovementModel.create({
      productId: new Types.ObjectId(productId),
      type: dto.type,
      quantity: dto.quantity,
      newQuantity: dto.newQuantity,
      previousQuantity: previous,
      resultingQuantity: resulting,
      reason: dto.reason,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      recordedBy: new Types.ObjectId(recordedBy),
      notes: dto.notes,
      date: new Date(),
    });

    // Update product stock
    await this.productModel.updateOne({ _id: product._id }, { $set: { stockQuantity: resulting } });

    return movement;
  }

  async listForProduct(productId: string, page = 1, limit = 50) {
    const p = Math.max(1, page);
    const l = Math.max(1, Math.min(200, limit));
    const [items, total] = await Promise.all([
      this.stockMovementModel
        .find({ productId })
        .sort({ date: -1, createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      this.stockMovementModel.countDocuments({ productId }),
    ]);
    return { items, total, page: p, limit: l };
  }
}