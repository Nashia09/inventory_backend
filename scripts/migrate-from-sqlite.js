/*
  One-time migration from SQLite (server/database/inventory.db) → MongoDB.
  Migrates products: name, sku, barcode, price, stock_quantity → stockQuantity, min_stock_level → minStockLevel, description.
*/

require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');

const SQLITE_DB_PATH = path.resolve(__dirname, '..', '..', 'server', 'database', 'inventory.db');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_dev';

// Define Product schema (JS-only; matches Nest Product schema names)
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

async function migrateProducts(sqliteDb) {
  console.log('Migrating products...');
  const rows = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM products', (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const doc = {
      name: row.name,
      sku: row.sku,
      barcode: row.barcode || undefined,
      price: Number(row.price) || 0,
      stockQuantity: Number(row.stock_quantity) || 0,
      minStockLevel: row.min_stock_level != null ? Number(row.min_stock_level) : undefined,
      description: row.description || undefined,
    };

    const res = await Product.updateOne(
      { sku: doc.sku },
      { $set: doc },
      { upsert: true }
    );

    // upsert result: If upsertedId exists → inserted; else → matched count updated
    if (res.upsertedId) inserted += 1;
    else if (res.modifiedCount) updated += 1;
  }

  console.log(`Products migrated: inserted=${inserted}, updated=${updated}, total=${rows.length}`);
}

async function main() {
  console.log('Starting migration: SQLite → MongoDB');
  console.log(`SQLite DB: ${SQLITE_DB_PATH}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);

  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await migrateProducts(sqliteDb);
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