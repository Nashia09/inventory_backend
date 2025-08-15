# Supermarket Inventory API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. After logging in, include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Authentication Endpoints

### POST /auth/login
Login with email and password. All roles (admin, manager, cashier) use this endpoint.

**Request Body:**
```json
{
  "email": "admin@supermarket.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@supermarket.com",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/register
Register a new user account (Admin only).

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@supermarket.com",
  "password": "password123",
  "role": "cashier"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "New User",
    "email": "newuser@supermarket.com",
    "role": "cashier"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/refresh
Refresh access token using refresh token (sent via HTTP-only cookie).

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Products Endpoints

### GET /products
Get paginated list of products with optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search products by name
- `categoryId` (optional): Filter by category ID
- `supplierId` (optional): Filter by supplier ID

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Coca Cola 500ml",
      "sku": "COKE-500",
      "categoryId": "507f1f77bcf86cd799439014",
      "supplierId": "507f1f77bcf86cd799439015",
      "price": 1.99,
      "quantity": 98,
      "description": "Classic Coca Cola",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### POST /products
Create a new product (Admin/Manager only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Orange Juice 1L",
  "sku": "OJ-1L",
  "categoryId": "507f1f77bcf86cd799439014",
  "supplierId": "507f1f77bcf86cd799439015",
  "price": 4.99,
  "quantity": 25,
  "description": "Fresh orange juice"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "name": "Orange Juice 1L",
  "sku": "OJ-1L",
  "categoryId": "507f1f77bcf86cd799439014",
  "supplierId": "507f1f77bcf86cd799439015",
  "price": 4.99,
  "quantity": 25,
  "description": "Fresh orange juice",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /products/{id}
Get a specific product by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "Coca Cola 500ml",
  "sku": "COKE-500",
  "categoryId": "507f1f77bcf86cd799439014",
  "supplierId": "507f1f77bcf86cd799439015",
  "price": 1.99,
  "quantity": 98,
  "description": "Classic Coca Cola",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /products/{id}
Update a product (Admin/Manager only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (partial update):**
```json
{
  "price": 2.49,
  "quantity": 150
}
```

### DELETE /products/{id}
Delete a product (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):** Empty response

## Categories Endpoints

### GET /categories
Get all categories.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Beverages",
    "description": "Drinks and beverages",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /categories
Create a new category (Admin/Manager only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Frozen Foods",
  "description": "Frozen food products"
}
```

## Suppliers Endpoints

### GET /suppliers
Get all suppliers (Admin/Manager only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "name": "FreshCorp Ltd",
    "contactInfo": "contact@freshcorp.com",
    "address": "123 Supply St, City",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /suppliers
Create a new supplier (Admin/Manager only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "New Supplier Co",
  "contactInfo": "sales@newsupplier.com",
  "address": "789 Business Ave, City"
}
```

## Sales Endpoints

### POST /sales
Record a new sale (Admin/Cashier only). Automatically updates product stock levels.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "productsSold": [
    {
      "productId": "507f1f77bcf86cd799439013",
      "productName": "Coca Cola 500ml",
      "quantity": 2,
      "unitPrice": 1.99
    },
    {
      "productId": "507f1f77bcf86cd799439016",
      "productName": "Orange Juice 1L", 
      "quantity": 1,
      "unitPrice": 4.99
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "productsSold": [
    {
      "productId": "507f1f77bcf86cd799439013",
      "productName": "Coca Cola 500ml",
      "quantity": 2,
      "unitPrice": 1.99,
      "totalPrice": 3.98
    },
    {
      "productId": "507f1f77bcf86cd799439016", 
      "productName": "Orange Juice 1L",
      "quantity": 1,
      "unitPrice": 4.99,
      "totalPrice": 4.99
    }
  ],
  "totalAmount": 8.97,
  "cashierId": "507f1f77bcf86cd799439012",
  "cashierName": "Cashier User",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /sales
Get paginated list of sales (Admin/Manager only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "productsSold": [
        {
          "productId": "507f1f77bcf86cd799439013",
          "productName": "Coca Cola 500ml",
          "quantity": 2,
          "unitPrice": 1.99,
          "totalPrice": 3.98
        }
      ],
      "totalAmount": 3.98,
      "cashierId": "507f1f77bcf86cd799439012",
      "cashierName": "Cashier User",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": [
    "name should not be empty",
    "price must be a positive number"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "Product not found",
  "error": "Not Found", 
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "message": "User with this email already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

## Role-Based Access Summary

| Role | Permissions |
|------|------------|
| **Admin** | Full access to all endpoints |
| **Manager** | Manage products, categories, suppliers; view sales |
| **Cashier** | Record sales, view products/categories |

## Data Models

### User
```json
{
  "name": "string",
  "email": "string (unique)",
  "password": "string (hashed)",
  "role": "admin | manager | cashier"
}
```

### Product
```json
{
  "name": "string",
  "sku": "string (unique)",
  "categoryId": "ObjectId",
  "supplierId": "ObjectId", 
  "price": "number",
  "quantity": "number (≥0)",
  "description": "string (optional)"
}
```

### Category
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

### Supplier
```json
{
  "name": "string",
  "contactInfo": "string (optional)",
  "address": "string (optional)"
}
```

### Sale
```json
{
  "productsSold": [
    {
      "productId": "ObjectId",
      "productName": "string",
      "quantity": "number (≥1)",
      "unitPrice": "number",
      "totalPrice": "number"
    }
  ],
  "totalAmount": "number",
  "cashierId": "ObjectId",
  "cashierName": "string"
}
```