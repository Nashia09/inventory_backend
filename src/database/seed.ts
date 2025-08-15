import { NestFactory } from '@nestjs/core';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { UsersModule } from '../modules/users/users.module';
import { CategoriesService } from '../modules/categories/categories.service';
import { CategoriesModule } from '../modules/categories/categories.module';
import { SuppliersService } from '../modules/suppliers/suppliers.service';
import { SuppliersModule } from '../modules/suppliers/suppliers.module';
import { ProductsService } from '../modules/products/products.service';
import { ProductsModule } from '../modules/products/products.module';
import { Role } from '../modules/users/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/supermarket'),
    UsersModule,
    CategoriesModule,
    SuppliersModule,
    ProductsModule,
  ],
})
class SeedModule {}

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule);

  const usersService = app.get(UsersService);
  const categoriesService = app.get(CategoriesService);
  const suppliersService = app.get(SuppliersService);
  const productsService = app.get(ProductsService);

  console.log('🌱 Starting database seeding...');

  // Create sample users
  const admin = await usersService.create({
    name: 'Admin User',
    email: 'admin@supermarket.com',
    password: 'admin123',
    role: Role.Admin,
  });

  const manager = await usersService.create({
    name: 'Manager User',
    email: 'manager@supermarket.com',
    password: 'manager123',
    role: Role.Manager,
  });

  const cashier = await usersService.create({
    name: 'Cashier User',
    email: 'cashier@supermarket.com',
    password: 'cashier123',
    role: Role.Cashier,
  });

  console.log('✅ Created users');

  // Create categories
  const categories = await Promise.all([
    categoriesService.create({ name: 'Beverages', description: 'Drinks and beverages' }),
    categoriesService.create({ name: 'Dairy', description: 'Milk, cheese, yogurt' }),
    categoriesService.create({ name: 'Snacks', description: 'Chips, crackers, nuts' }),
    categoriesService.create({ name: 'Fresh Produce', description: 'Fruits and vegetables' }),
  ]);

  console.log('✅ Created categories');

  // Create suppliers
  const suppliers = await Promise.all([
    suppliersService.create({
      name: 'FreshCorp Ltd',
      contactInfo: 'contact@freshcorp.com',
      address: '123 Supply St, City',
    }),
    suppliersService.create({
      name: 'Global Foods Inc',
      contactInfo: 'sales@globalfoods.com',
      address: '456 Trade Ave, City',
    }),
    suppliersService.create({
      name: 'Local Farms Co',
      contactInfo: 'orders@localfarms.com',
      address: '789 Farm Rd, City',
    }),
  ]);

  console.log('✅ Created suppliers');

  // Create products
  const products = [
    {
      name: 'Coca Cola 500ml',
      sku: 'COKE-500',
      categoryId: (categories[0] as any)._id,
      supplierId: (suppliers[1] as any)._id,
      price: 1.99,
      quantity: 100,
      description: 'Classic Coca Cola',
    },
    {
      name: 'Milk 1L',
      sku: 'MILK-1L',
      categoryId: (categories[1] as any)._id,
      supplierId: (suppliers[0] as any)._id,
      price: 2.49,
      quantity: 50,
      description: 'Fresh whole milk',
    },
    {
      name: 'Potato Chips',
      sku: 'CHIPS-REG',
      categoryId: (categories[2] as any)._id,
      supplierId: (suppliers[1] as any)._id,
      price: 3.99,
      quantity: 75,
      description: 'Regular salted chips',
    },
    {
      name: 'Bananas (per kg)',
      sku: 'BANANA-KG',
      categoryId: (categories[3] as any)._id,
      supplierId: (suppliers[2] as any)._id,
      price: 2.99,
      quantity: 30,
      description: 'Fresh bananas',
    },
    {
      sku: 'SKU-002',
      name: 'Samsung Galaxy S21',
      price: 699.99,
      quantity: 30,
      categoryId: (categories[0] as any)._id,
      supplierId: (suppliers[1] as any)._id,
      description: 'Flagship smartphone from Samsung',
    },
    {
      name: 'Google Pixel 6',
      sku: 'SKU-004',
      price: 599.99,
      quantity: 20,
      categoryId: (categories[2] as any)._id,
      supplierId: (suppliers[1] as any)._id,
      description: "Google's newest Pixel smartphone",
    },
  ];

  await Promise.all(products.map((product) => productsService.create(product)));

  console.log('✅ Created products');
  console.log('🎉 Database seeding completed!');

  console.log('\n📋 Sample Login Credentials:');
  console.log('Admin: admin@supermarket.com / admin123');
  console.log('Manager: manager@supermarket.com / manager123');
  console.log('Cashier: cashier@supermarket.com / cashier123');

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});