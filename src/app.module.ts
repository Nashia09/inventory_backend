import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// Using global ValidationPipe configured in main.ts
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { SalesModule } from './modules/sales/sales.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CreditPaymentsModule } from './modules/credit-payments/credit-payments.module';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    SuppliersModule,
    SalesModule,
    CustomersModule,
    CreditPaymentsModule,
    StockMovementsModule,
    AnalyticsModule,
  ],
  // Providers not needed here; global pipes configured in main.ts
})
export class AppModule {}