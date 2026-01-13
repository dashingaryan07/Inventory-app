import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import connectDB from '../config/database.js';

dotenv.config();

// Connect to database
await connectDB();

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    
    console.log('🗑️  Cleared existing data');

    // Create Tenants
    const tenants = await Tenant.create([
      {
        tenantId: 'TECH001',
        name: 'TechStore Inc.',
        businessType: 'Electronics Retailer',
        email: 'admin@techstore.com',
        isActive: true,
        subscription: {
          plan: 'premium',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      },
      {
        tenantId: 'FASHION001',
        name: 'FashionHub',
        businessType: 'Fashion & Apparel',
        email: 'admin@fashionhub.com',
        isActive: true,
        subscription: {
          plan: 'basic',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      }
    ]);

    console.log('✅ Created tenants');

    // Create Users
    const users = await User.create([
      {
        tenantId: 'TECH001',
        name: 'John Smith',
        email: 'owner@techstore.com',
        password: 'demo123',
        role: 'Owner',
        isActive: true
      },
      {
        tenantId: 'TECH001',
        name: 'Jane Doe',
        email: 'manager@techstore.com',
        password: 'demo123',
        role: 'Manager',
        isActive: true
      },
      {
        tenantId: 'FASHION001',
        name: 'Sarah Johnson',
        email: 'manager@fashionhub.com',
        password: 'demo123',
        role: 'Manager',
        isActive: true
      },
      {
        tenantId: 'FASHION001',
        name: 'Mike Wilson',
        email: 'staff@fashionhub.com',
        password: 'demo123',
        role: 'Staff',
        isActive: true
      }
    ]);

    console.log('✅ Created users');

    // Create Suppliers
    const suppliers = await Supplier.create([
      {
        tenantId: 'TECH001',
        name: 'Apple Inc.',
        contactPerson: 'Tim Cook',
        email: 'supplier@apple.com',
        phone: '+1-800-MY-APPLE',
        paymentTerms: 'Net 30',
        isActive: true
      },
      {
        tenantId: 'TECH001',
        name: 'Samsung Electronics',
        contactPerson: 'Lee Jae-yong',
        email: 'supplier@samsung.com',
        phone: '+82-2-2255-0114',
        paymentTerms: 'Net 45',
        isActive: true
      },
      {
        tenantId: 'FASHION001',
        name: 'Cotton Mills Co.',
        contactPerson: 'David Brown',
        email: 'sales@cottonmills.com',
        phone: '+1-555-0123',
        paymentTerms: 'Net 30',
        isActive: true
      }
    ]);

    console.log('✅ Created suppliers');

    // Create Products for TechStore
    const techProducts = await Product.create([
      {
        tenantId: 'TECH001',
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone with Dynamic Island',
        category: 'Smartphones',
        basePrice: 999,
        imageUrl: '📱',
        variants: [
          { sku: 'IPH14P-128-BLK', attributes: new Map([['storage', '128GB'], ['color', 'Black']]), stock: 45, price: 999, lowStockThreshold: 20 },
          { sku: 'IPH14P-256-BLK', attributes: new Map([['storage', '256GB'], ['color', 'Black']]), stock: 5, price: 1099, lowStockThreshold: 20 },
          { sku: 'IPH14P-128-WHT', attributes: new Map([['storage', '128GB'], ['color', 'White']]), stock: 89, price: 999, lowStockThreshold: 20 },
          { sku: 'IPH14P-256-WHT', attributes: new Map([['storage', '256GB'], ['color', 'White']]), stock: 95, price: 1099, lowStockThreshold: 20 }
        ],
        isActive: true
      },
      {
        tenantId: 'TECH001',
        name: 'MacBook Air M2',
        description: 'Thin, light, and powerful',
        category: 'Laptops',
        basePrice: 1199,
        imageUrl: '💻',
        variants: [
          { sku: 'MBA-M2-8-256-SLV', attributes: new Map([['ram', '8GB'], ['storage', '256GB'], ['color', 'Silver']]), stock: 12, price: 1199, lowStockThreshold: 15 },
          { sku: 'MBA-M2-16-512-SLV', attributes: new Map([['ram', '16GB'], ['storage', '512GB'], ['color', 'Silver']]), stock: 28, price: 1499, lowStockThreshold: 15 },
          { sku: 'MBA-M2-8-256-GRY', attributes: new Map([['ram', '8GB'], ['storage', '256GB'], ['color', 'Space Gray']]), stock: 27, price: 1199, lowStockThreshold: 15 }
        ],
        isActive: true
      },
      {
        tenantId: 'TECH001',
        name: 'AirPods Pro (2nd Gen)',
        description: 'Active noise cancellation',
        category: 'Audio',
        basePrice: 249,
        imageUrl: '🎧',
        variants: [
          { sku: 'APP-2GEN-WHT', attributes: new Map([['color', 'White']]), stock: 156, price: 249, lowStockThreshold: 30 }
        ],
        isActive: true
      }
    ]);

    console.log('✅ Created TechStore products');

    // Create Products for FashionHub
    const fashionProducts = await Product.create([
      {
        tenantId: 'FASHION001',
        name: 'Premium Cotton T-Shirt',
        description: 'Comfortable everyday wear',
        category: 'Apparel',
        basePrice: 29,
        imageUrl: '👕',
        variants: [
          { sku: 'TSH-S-BLK', attributes: new Map([['size', 'S'], ['color', 'Black']]), stock: 45, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-M-BLK', attributes: new Map([['size', 'M'], ['color', 'Black']]), stock: 67, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-L-BLK', attributes: new Map([['size', 'L'], ['color', 'Black']]), stock: 89, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-S-WHT', attributes: new Map([['size', 'S'], ['color', 'White']]), stock: 52, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-M-WHT', attributes: new Map([['size', 'M'], ['color', 'White']]), stock: 78, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-L-WHT', attributes: new Map([['size', 'L'], ['color', 'White']]), stock: 56, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-S-BLU', attributes: new Map([['size', 'S'], ['color', 'Blue']]), stock: 8, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-M-BLU', attributes: new Map([['size', 'M'], ['color', 'Blue']]), stock: 25, price: 29, lowStockThreshold: 20 },
          { sku: 'TSH-L-BLU', attributes: new Map([['size', 'L'], ['color', 'Blue']]), stock: 25, price: 29, lowStockThreshold: 20 }
        ],
        isActive: true
      },
      {
        tenantId: 'FASHION001',
        name: 'Denim Jeans',
        description: 'Classic fit denim',
        category: 'Apparel',
        basePrice: 79,
        imageUrl: '👖',
        variants: [
          { sku: 'JEAN-28-BLU', attributes: new Map([['size', '28'], ['color', 'Blue']]), stock: 15, price: 79, lowStockThreshold: 10 },
          { sku: 'JEAN-30-BLU', attributes: new Map([['size', '30'], ['color', 'Blue']]), stock: 34, price: 79, lowStockThreshold: 10 },
          { sku: 'JEAN-32-BLU', attributes: new Map([['size', '32'], ['color', 'Blue']]), stock: 28, price: 79, lowStockThreshold: 10 },
          { sku: 'JEAN-28-BLK', attributes: new Map([['size', '28'], ['color', 'Black']]), stock: 3, price: 79, lowStockThreshold: 10 },
          { sku: 'JEAN-30-BLK', attributes: new Map([['size', '30'], ['color', 'Black']]), stock: 22, price: 79, lowStockThreshold: 10 },
          { sku: 'JEAN-32-BLK', attributes: new Map([['size', '32'], ['color', 'Black']]), stock: 19, price: 79, lowStockThreshold: 10 }
        ],
        isActive: true
      }
    ]);

    console.log('✅ Created FashionHub products');

    console.log(`
╔═══════════════════════════════════════╗
║   ✅ DATABASE SEEDED SUCCESSFULLY     ║
╠═══════════════════════════════════════╣
║   Tenants: ${tenants.length}                           ║
║   Users: ${users.length}                             ║
║   Suppliers: ${suppliers.length}                        ║
║   Products: ${techProducts.length + fashionProducts.length}                          ║
╠═══════════════════════════════════════╣
║   Demo Credentials:                   ║
║   Tenant: TECH001                     ║
║   Email: owner@techstore.com          ║
║   Password: demo123                   ║
║                                       ║
║   Tenant: FASHION001                  ║
║   Email: manager@fashionhub.com       ║
║   Password: demo123                   ║
╚═══════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();