import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      example: {
        today: { revenue: 1500, transactions: 25, profit: 300 },
        yesterday: { revenue: 1200, transactions: 20, profit: 250 },
        weekly: { revenue: 8500, transactions: 150, profit: 1700 },
        products: { total: 150, lowStock: 15 },
        users: { total: 25, activeToday: 8 }
      }
    }
  })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('sales-trends')
  @ApiOperation({ summary: 'Get sales trends over time' })
  @ApiQuery({ name: 'period', required: false, enum: ['7days', '30days', '12months'] })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Sales trends retrieved successfully',
    schema: {
      example: [
        { date: '2024-01-01', sales: 1500, profit: 300 },
        { date: '2024-01-02', sales: 1800, profit: 360 }
      ]
    }
  })
  async getSalesTrends(
    @Query('period') period: string = '30days',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getSalesTrends(period, start, end);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'period', required: false, enum: ['7days', '30days', '12months'] })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Top products retrieved successfully',
    schema: {
      example: [
        { name: 'Product A', quantity: 150, revenue: 3000 },
        { name: 'Product B', quantity: 120, revenue: 2400 }
      ]
    }
  })
  async getTopProducts(
    @Query('limit') limit: number = 10,
    @Query('period') period?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getTopProducts(Number(limit), period, start, end);
  }

  @Get('sales-by-category')
  @ApiOperation({ summary: 'Get sales by category' })
  @ApiQuery({ name: 'period', required: false, enum: ['7days', '30days', '12months'] })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Sales by category retrieved successfully',
    schema: {
      example: [
        { name: 'Electronics', value: 5000 },
        { name: 'Clothing', value: 3000 }
      ]
    }
  })
  async getSalesByCategory(
    @Query('period') period: string = '30days',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getSalesByCategory(period, start, end);
  }

  @Get('cashier-performance')
  @ApiOperation({ summary: 'Get cashier performance' })
  @ApiQuery({ name: 'period', required: false, enum: ['7days', '30days', '12months'] })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Cashier performance retrieved successfully',
    schema: {
      example: [
        { name: 'John Doe', sales: 5000, transactions: 50, avg_time: 3.2 },
        { name: 'Jane Smith', sales: 4500, transactions: 45, avg_time: 2.8 }
      ]
    }
  })
  async getCashierPerformance(
    @Query('period') period: string = '30days',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getCashierPerformance(period, start, end);
  }

  @Get('customer-segments')
  @ApiOperation({ summary: 'Get customer segments by outstanding balance' })
  @ApiQuery({ name: 'period', required: false, enum: ['7days', '30days', '12months'] })
  @ApiResponse({
    status: 200,
    description: 'Customer segments retrieved successfully',
    schema: {
      example: [
        { segment: 'Premium', count: 25, value: 12.5 },
        { segment: 'Regular', count: 75, value: 37.5 },
        { segment: 'Occasional', count: 100, value: 50.0 }
      ]
    }
  })
  async getCustomerSegments(@Query('period') period: string = '30days') {
    return this.analyticsService.getCustomerSegments(period);
  }

  @Get('hourly-pattern')
  @ApiOperation({ summary: 'Get hourly sales pattern' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Hourly sales pattern retrieved successfully',
    schema: {
      example: [
        { hour: 0, sales: 100 },
        { hour: 1, sales: 50 },
        { hour: 2, sales: 75 }
      ]
    }
  })
  async getHourlyPattern(@Query('days') days?: number) {
    return this.analyticsService.getHourlyPattern(days);
  }

  @Get('inventory-valuation')
  @ApiOperation({ summary: 'Get inventory valuation' })
  @ApiResponse({
    status: 200,
    description: 'Inventory valuation retrieved successfully',
    schema: {
      example: {
        total: 50000,
        byCategory: [
          { category: 'Electronics', value: 20000 },
          { category: 'Clothing', value: 15000 }
        ]
      }
    }
  })
  async getInventoryValuation() {
    return this.analyticsService.getInventoryValuation();
  }
}