# Supermarket Inventory Management System Backend

A complete NestJS + MongoDB backend for supermarket inventory management with JWT authentication and role-based access control.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens and role-based access (Admin, Manager, Cashier)
- **Complete CRUD APIs**: Products, Categories, Suppliers, Sales, Users
- **Automatic Stock Management**: Stock levels updated automatically when sales are recorded
- **Comprehensive Documentation**: Swagger/OpenAPI docs at `/api-docs`
- **Data Validation**: DTOs with class-validator for all endpoints
- **Pagination & Filtering**: Support for listing endpoints

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

## Quick Start

### Prerequisites

- Node.js (v16+)
- MongoDB running locally or connection string

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your MongoDB URI and JWT secrets:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/supermarket
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SWAGGER_PATH=/api-docs
NODE_ENV=development
```

3. Start the application:
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

4. Seed the database with sample data:
```bash
npm run seed
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **API Base**: http://localhost:3000

### Sample Login Credentials (after seeding)

- **Admin**: admin@supermarket.com / admin123
- **Manager**: manager@supermarket.com / manager123  
- **Cashier**: cashier@supermarket.com / cashier123

## Role Permissions

| Endpoint | Admin | Manager | Cashier |
|----------|-------|---------|---------|
| Users (CRUD) | ✅ | ❌ | ❌ |
| Products (CRUD) | ✅ | ✅ | View Only |
| Categories (CRUD) | ✅ | ✅ | View Only |
| Suppliers (CRUD) | ✅ | ✅ | ❌ |
| Sales (Create) | ✅ | ❌ | ✅ |
| Sales (View) | ✅ | ✅ | ❌ |

## API Endpoints Overview

### Authentication
- `POST /auth/register` - Register new user (admin only)
- `POST /auth/login` - Login (all roles)
- `POST /auth/refresh` - Refresh access token

### Products
- `GET /products` - List products (with pagination/filtering)
- `POST /products` - Create product
- `GET /products/:id` - Get product by ID
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Categories
- `GET /categories` - List all categories
- `POST /categories` - Create category
- `GET /categories/:id` - Get category by ID
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Suppliers
- `GET /suppliers` - List all suppliers
- `POST /suppliers` - Create supplier
- `GET /suppliers/:id` - Get supplier by ID
- `PATCH /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

### Sales
- `POST /sales` - Record new sale
- `GET /sales` - List sales (with pagination)
- `GET /sales/:id` - Get sale by ID

## Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication module
│   ├── users/          # User management
│   ├── products/       # Product management
│   ├── categories/     # Category management
│   ├── suppliers/      # Supplier management
│   └── sales/          # Sales management
├── common/
│   ├── decorators/     # Custom decorators
│   ├── guards/         # Auth & role guards
│   └── interceptors/   # Request/response interceptors
├── database/
│   └── seed.ts         # Database seeding script
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

## Development

```bash
# Watch mode
npm run start:dev

# Run tests
npm run test

# Lint and format
npm run lint
npm run format

# Build for production
npm run build
```

## Sample API Usage

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@supermarket.com",
    "password": "admin123"
  }'
```

### Create Product (with Bearer token)
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Orange Juice 1L",
    "sku": "OJ-1L",
    "categoryId": "CATEGORY_ID",
    "supplierId": "SUPPLIER_ID", 
    "price": 4.99,
    "quantity": 25,
    "description": "Fresh orange juice"
  }'
```

### Record Sale
```bash
curl -X POST http://localhost:3000/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "productsSold": [
      {
        "productId": "PRODUCT_ID",
        "productName": "Coca Cola 500ml",
        "quantity": 2,
        "unitPrice": 1.99
      }
    ]
  }'
```

## License

MIT