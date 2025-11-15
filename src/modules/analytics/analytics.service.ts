import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  private getDateRange(period: string = '30days', start?: string, end?: string) {
    let startDate: Date;
    let endDate: Date;

    if (start && end) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const days = period === '7days' ? 7 : period === '12months' ? 365 : 30;
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todaySales, yesterdaySales, weeklySales] = await Promise.all([
      this.saleModel.find({ createdAt: { $gte: today } }).lean(),
      this.saleModel.find({ createdAt: { $gte: yesterday, $lt: today } }).lean(),
      this.saleModel.find({ createdAt: { $gte: weekAgo } }).lean(),
    ]);

    const toRevenue = (arr: any[]) => arr.reduce((sum, s: any) => sum + (s.totalAmount || 0), 0);
    const todayRevenue = toRevenue(todaySales);
    const yesterdayRevenue = toRevenue(yesterdaySales);
    const weeklyRevenue = toRevenue(weeklySales);

    // Simple profit estimate due to lack of product cost data
    const profitRate = 0.2;
    const todayProfit = todayRevenue * profitRate;
    const yesterdayProfit = yesterdayRevenue * profitRate;
    const weeklyProfit = weeklyRevenue * profitRate;

    const [totalProducts, lowStockProducts, outOfStockProducts, totalUsers, activeToday] = await Promise.all([
      this.productModel.countDocuments(),
      this.productModel.countDocuments({
        $expr: {
          $and: [
            { $gt: ['$stockQuantity', 0] },
            { $lte: ['$stockQuantity', { $ifNull: ['$minStockLevel', 0] }] },
          ],
        },
      }),
      this.productModel.countDocuments({ stockQuantity: 0 }),
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ lastLoginAt: { $gte: today } }),
    ]);

    return {
      today: { revenue: todayRevenue, transactions: todaySales.length, profit: todayProfit },
      yesterday: { revenue: yesterdayRevenue, transactions: yesterdaySales.length, profit: yesterdayProfit },
      weekly: { revenue: weeklyRevenue, transactions: weeklySales.length, profit: weeklyProfit },
      products: { total: totalProducts, lowStock: lowStockProducts, outOfStock: outOfStockProducts },
      users: { total: totalUsers, activeToday },
    };
  }

  async getSalesTrends(period: string = '30days', start?: string, end?: string) {
    const { startDate, endDate } = this.getDateRange(period, start, end);

    const results = await this.saleModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', sales: 1, profit: { $multiply: ['$sales', 0.2] } } },
    ]);

    return results;
  }

  async getTopProducts(limit: number = 10, period?: string, start?: string, end?: string) {
    const { startDate, endDate } = this.getDateRange(period ?? '30days', start, end);

    const results = await this.saleModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$productsSold' },
      {
        $group: {
          _id: { id: '$productsSold.productId', name: '$productsSold.productName' },
          quantity: { $sum: '$productsSold.quantity' },
          revenue: { $sum: '$productsSold.totalPrice' },
        },
      },
      { $project: { _id: 0, name: '$_id.name', quantity: 1, revenue: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);

    return results;
  }

  async getSalesByCategory(period: string = '30days', start?: string, end?: string) {
    const { startDate, endDate } = this.getDateRange(period, start, end);

    const results = await this.saleModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$productsSold' },
      {
        $lookup: {
          from: 'products',
          localField: 'productsSold.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$category.name', 'Uncategorized'] },
          value: { $sum: '$productsSold.totalPrice' },
        },
      },
      { $project: { _id: 0, name: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]);

    return results;
  }

  async getCashierPerformance(period: string = '30days', start?: string, end?: string) {
    const { startDate, endDate } = this.getDateRange(period, start, end);

    const results = await this.saleModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$productsSold' },
      {
        $group: {
          _id: '$cashierName',
          sales: { $sum: '$productsSold.totalPrice' },
          transactionsSet: { $addToSet: '$_id' },
          totalItems: { $sum: '$productsSold.quantity' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          sales: 1,
          transactions: { $size: '$transactionsSet' },
          totalItems: 1,
          avg_time: {
            $round: [
              {
                $add: [
                  2,
                  {
                    $multiply: [
                      {
                        $cond: [
                          { $gt: [{ $size: '$transactionsSet' }, 0] },
                          { $divide: ['$totalItems', { $size: '$transactionsSet' }] },
                          0,
                        ],
                      },
                      0.2,
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { sales: -1 } },
    ]);

    return results;
  }

  async getCustomerSegments(period: string = '30days') {
    const [premiumCount, regularCount, occasionalCount] = await Promise.all([
      this.customerModel.countDocuments({ outstandingBalance: { $gte: 100000 } }),
      this.customerModel.countDocuments({ outstandingBalance: { $gte: 50000, $lt: 100000 } }),
      this.customerModel.countDocuments({ outstandingBalance: { $lt: 50000 } }),
    ]);

    const total = premiumCount + regularCount + occasionalCount;
    const pct = (n: number) => (total > 0 ? Number(((n / total) * 100).toFixed(2)) : 0);

    return [
      { segment: 'Premium', count: premiumCount, value: pct(premiumCount) },
      { segment: 'Regular', count: regularCount, value: pct(regularCount) },
      { segment: 'Occasional', count: occasionalCount, value: pct(occasionalCount) },
    ];
  }

  async getHourlyPattern(days?: number) {
    const d = Number.isFinite(days as number) && (days as number) > 0 ? (days as number) : 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - d);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const grouped = await this.saleModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          sales: { $sum: '$totalAmount' },
        },
      },
      { $project: { _id: 0, hour: '$_id', sales: 1 } },
      { $sort: { hour: 1 } },
    ]);

    const map = new Map<number, number>();
    grouped.forEach((g: any) => map.set(g.hour ?? 0, g.sales ?? 0));

    return Array.from({ length: 24 }, (_, h) => ({ hour: h, sales: map.get(h) ?? 0 }));
  }

  async getInventoryValuation() {
    const summary = await this.productModel.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
          valuation: { $multiply: ['$price', '$stockQuantity'] },
        },
      },
      {
        $group: {
          _id: '$categoryName',
          value: { $sum: '$valuation' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$value' },
          byCategory: { $push: { category: '$_id', value: '$value' } },
        },
      },
      { $project: { _id: 0, total: 1, byCategory: 1 } },
    ]);

    return summary[0] ?? { total: 0, byCategory: [] };
  }
}