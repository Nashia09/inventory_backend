/*
  One-time migration from SQLite (server/database/inventory.db)  MongoDB.
  Migrates: users, categories, suppliers (from product.supplier), products, customers,
            sales (+ sale_items into productsSold), stock_movements, credit_payments.

  Notes:
  - This script is idempotent for users/categories/customers/products (uses upsert).
  - Sales, stock movements, and credit payments are inserted (no unique keys in schema);
    re-running may create duplicates.
  - Some SQLite fields have no direct Mongo schema fields (e.g., transaction_id, tax_amount,
    payment_method, status). These are omitted or embedded into notes where suitable.
*/

require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');

const SQLITE_DB_PATH = path.resolve(__dirname, '..', '..', 'server', 'database', 'inventory.db');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_dev';

// ----- Define inline Mongoose schemas (JS-only, matching Nest models) -----

const Role = { Admin: 'admin', Manager: 'manager', Cashier: 'cashier' };

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.Cashier },
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);
const Category = mongoose.model('Category', categorySchema);

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    contactInfo: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);
const Supplier = mongoose.model('Supplier', supplierSchema);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    price: { type: Number, required: true },
    barcode: { type: String },
    stockQuantity: { type: Number, required: true, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    description: { type: String },
  },
  { timestamps: true }
);
const Product = mongoose.model('Product', productSchema);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    creditLimit: { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Customer = mongoose.model('Customer', customerSchema);

const productSoldSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    productsSold: [productSoldSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName: { type: String, required: true },
  },
  { timestamps: true }
);
const Sale = mongoose.model('Sale', saleSchema);

const stockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
    quantity: { type: Number, min: 0 },
    newQuantity: { type: Number, min: 0 },
    previousQuantity: { type: Number, min: 0 },
    resultingQuantity: { type: Number, min: 0 },
    reason: { type: String },
    referenceType: { type: String },
    referenceId: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);
const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

const creditPaymentSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    note: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
const CreditPayment = mongoose.model('CreditPayment', creditPaymentSchema);

// ----- Helpers -----
function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}
function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

// Mapping caches: SQLite id  Mongo ObjectId + convenient data
const maps = {
  users: new Map(), // id -> { _id, name, email }
  customers: new Map(), // id -> { _id, name }
  products: new Map(), // id -> { _id, name, sku }
  categoriesByName: new Map(), // name -> { _id }
  suppliersByName: new Map(), // name -> { _id }
};

// ----- Migration Steps -----
async function migrateUsers(db) {
  console.log('Migrating users...');
  const rows = await dbAll(db, 'SELECT * FROM users');
  let inserted = 0, updated = 0;
  for (const r of rows) {
    const name = r.full_name || r.username || r.email;
    const doc = { name, email: r.email, password: r.password_hash, role: r.role };
    const user = await User.findOneAndUpdate(
      { email: r.email },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (user) {
      if (user.createdAt && Math.abs(new Date(user.createdAt).getTime() - Date.now()) < 2000) inserted++;
      else updated++;
      maps.users.set(r.id, { _id: user._id, name: user.name, email: user.email });
    }
  }
  console.log(`Users migrated: inserted=${inserted}, updated=${updated}, total=${rows.length}`);
}

async function migrateCategories(db) {
  console.log('Migrating categories...');
  const rows = await dbAll(db, 'SELECT DISTINCT name, description FROM categories');
  let inserted = 0, updated = 0;
  for (const r of rows) {
    if (!r.name) continue;
    const cat = await Category.findOneAndUpdate(
      { name: r.name },
      { $set: { name: r.name, description: r.description || undefined } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    maps.categoriesByName.set(r.name, { _id: cat._id });
    if (cat) {
      if (cat.createdAt && Math.abs(new Date(cat.createdAt).getTime() - Date.now()) < 2000) inserted++;
      else updated++;
    }
  }
  console.log(`Categories migrated: inserted=${inserted}, updated=${updated}, total=${rows.length}`);
}

async function migrateSuppliersFromProducts(db) {
  console.log('Migrating suppliers (derived from products.supplier)...');
  const rows = await dbAll(db, "SELECT DISTINCT supplier FROM products WHERE supplier IS NOT NULL AND TRIM(supplier) <> ''");
  let inserted = 0, updated = 0;
  for (const r of rows) {
    const name = (r.supplier || '').trim();
    if (!name) continue;
    const sup = await Supplier.findOneAndUpdate(
      { name },
      { $set: { name } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    maps.suppliersByName.set(name, { _id: sup._id });
    if (sup) {
      if (sup.createdAt && Math.abs(new Date(sup.createdAt).getTime() - Date.now()) < 2000) inserted++;
      else updated++;
    }
  }
  console.log(`Suppliers migrated: inserted=${inserted}, updated=${updated}, total=${rows.length}`);
}

async function migrateProducts(db) {
  console.log('Migrating products...');
  const rows = await dbAll(db, 'SELECT * FROM products');
  let inserted = 0, updated = 0;
  for (const r of rows) {
    const categoryId = r.category ? maps.categoriesByName.get(r.category)?._id : undefined;
    const supplierId = r.supplier ? maps.suppliersByName.get(r.supplier)?._id : undefined;
    const doc = {
      name: r.name,
      sku: r.sku,
      barcode: r.barcode || undefined,
      price: Number(r.price) || 0,
      stockQuantity: Number(r.stock_quantity) || 0,
      minStockLevel: r.min_stock_level != null ? Number(r.min_stock_level) : undefined,
      description: r.description || undefined,
      categoryId,
      supplierId,
    };

    const prod = await Product.findOneAndUpdate(
      { sku: doc.sku },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (prod) {
      maps.products.set(r.id, { _id: prod._id, name: prod.name, sku: prod.sku });
      if (prod.createdAt && Math.abs(new Date(prod.createdAt).getTime() - Date.now()) < 2000) inserted++;
      else updated++;
    }
  }
  console.log(`Products migrated: inserted=${inserted}, updated=${updated}, total=${rows.length}`);
}

async function migrateCustomers(db) {
  console.log('Migrating customers...');
  const rows = await dbAll(db, 'SELECT * FROM customers');
  let inserted = 0, updated = 0;
  for (const r of rows) {
    const match = r.email ? { email: r.email } : { name: r.name, phone: r.phone || null };
    const doc = {
      name: r.name,
      phone: r.phone || undefined,
      email: r.email || undefined,
      address: r.address || undefined,
      creditLimit: Number(r.credit_limit) || 0,
      outstandingBalance: Number(r.outstanding_balance) || 0,
      isActive: r.is_active == null ? true : Boolean(r.is_active),
    };
    const cust = await Customer.findOneAndUpdate(match, { $set: doc }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (cust) {
      maps.customers.set(r.id, { _id: cust._id, name: cust.name });
      if (cust.createdAt && Math.abs(new Date(cust.createdAt).getTime() - Date.now()) < 2000) inserted++;
      else updated++;
    }
  }
  console.log(`Customers migrated: inserted=${inserted}, updated=${updated}, total=${rows.length}`);
}

async function migrateSalesAndItems(db) {
  console.log('Migrating sales + sale_items...');
  const sales = await dbAll(db, 'SELECT * FROM sales');
  let inserted = 0;
  for (const s of sales) {
    // Build productsSold from sale_items
    const items = await dbAll(db, 'SELECT * FROM sale_items WHERE sale_id = ?', [s.id]);
    const productsSold = [];
    for (const it of items) {
      const prodMap = maps.products.get(it.product_id);
      let productName = 'Unknown Product';
      if (prodMap) productName = prodMap.name;
      else {
        const pRow = await dbGet(db, 'SELECT name FROM products WHERE id = ?', [it.product_id]);
        if (pRow && pRow.name) productName = pRow.name;
      }
      const productId = prodMap?._id || null;
      if (!productId) {
        console.warn(` Skipping sale_item ${it.id}: product ${it.product_id} not migrated`);
        continue;
      }
      productsSold.push({
        productId,
        productName,
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unit_price) || 0,
        totalPrice: Number(it.total_price) || 0,
      });
    }

    const cashier = maps.users.get(s.cashier_id);
    const cashierId = cashier?._id;
    const cashierName = cashier?.name || cashier?.email || 'Unknown Cashier';
    const totalAmount = Number(s.total_amount) || productsSold.reduce((sum, i) => sum + i.totalPrice, 0);

    if (!cashierId) {
      console.warn(` Skipping sale ${s.id}: cashier ${s.cashier_id} not migrated`);
      continue;
    }
    if (productsSold.length === 0) {
      console.warn(` Skipping sale ${s.id}: no sale_items migrated`);
      continue;
    }

    const sale = new Sale({ productsSold, totalAmount, cashierId, cashierName });
    await sale.save();
    inserted++;
  }
  console.log(`Sales migrated: inserted=${inserted}, total=${sales.length}`);
}

async function migrateStockMovements(db) {
  console.log('Migrating stock_movements...');
  const rows = await dbAll(db, 'SELECT * FROM stock_movements');
  let inserted = 0;
  for (const r of rows) {
    const prod = maps.products.get(r.product_id);
    const user = maps.users.get(r.performed_by);
    if (!prod || !user) {
      console.warn(` Skipping stock_movement ${r.id}: missing product/user mapping`);
      continue;
    }

    const doc = {
      productId: prod._id,
      type: r.movement_type,
      quantity: r.movement_type !== 'adjustment' ? Number(r.quantity) || 0 : undefined,
      newQuantity: r.movement_type === 'adjustment' ? Number(r.new_stock) || 0 : undefined,
      previousQuantity: Number(r.previous_stock) || 0,
      resultingQuantity: Number(r.new_stock) || 0,
      reason: r.reason || undefined,
      referenceType: r.reference_type || undefined,
      referenceId: r.reference_id != null ? String(r.reference_id) : undefined,
      recordedBy: user._id,
      date: r.created_at ? new Date(r.created_at) : new Date(),
    };

    await StockMovement.create(doc);
    inserted++;
  }
  console.log(`Stock movements migrated: inserted=${inserted}, total=${rows.length}`);
}

async function migrateCreditPayments(db) {
  console.log('Migrating credit_payments...');
  const rows = await dbAll(db, 'SELECT * FROM credit_payments');
  let inserted = 0;
  for (const r of rows) {
    const cust = maps.customers.get(r.customer_id);
    const user = maps.users.get(r.recorded_by);
    if (!cust || !user) {
      console.warn(` Skipping credit_payment ${r.id}: missing customer/user mapping`);
      continue;
    }

    const noteParts = [];
    if (r.payment_method) noteParts.push(`method=${r.payment_method}`);
    if (r.notes) noteParts.push(r.notes);
    if (r.sale_id != null) noteParts.push(`sale_id=${r.sale_id}`);

    const doc = {
      customerId: cust._id,
      amount: Number(r.amount) || 0,
      date: r.payment_date ? new Date(r.payment_date) : new Date(),
      note: noteParts.length ? noteParts.join(' | ') : undefined,
      recordedBy: user._id,
    };

    await CreditPayment.create(doc);
    inserted++;
  }
  console.log(`Credit payments migrated: inserted=${inserted}, total=${rows.length}`);
}

async function main() {
  console.log('Starting full migration: SQLite  MongoDB');
  console.log(`SQLite DB: ${SQLITE_DB_PATH}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);

  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    // Order matters for relational mapping
    await migrateUsers(sqliteDb);
    await migrateCategories(sqliteDb);
    await migrateSuppliersFromProducts(sqliteDb);
    await migrateProducts(sqliteDb);
    await migrateCustomers(sqliteDb);
    await migrateSalesAndItems(sqliteDb);
    await migrateStockMovements(sqliteDb);
    await migrateCreditPayments(sqliteDb);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    sqliteDb.close();
    console.log('Migration finished.');
  }
}

main();
