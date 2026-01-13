import mongoose from 'mongoose';

// Variant Schema (embedded in Product)
const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  attributes: {
    type: Map,
    of: String,
    // Examples: { size: 'L', color: 'Red' } or { storage: '256GB', color: 'Black' }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0 // Stock can never be negative
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Version key for optimistic locking (prevents race conditions)
  version: {
    type: Number,
    default: 0
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  variants: [variantSchema],
  imageUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Computed field - updated via methods
  totalStock: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for tenant isolation and performance
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, name: 'text' });
productSchema.index({ 'variants.sku': 1, tenantId: 1 });

// Update total stock when variants change
productSchema.methods.updateTotalStock = function() {
  this.totalStock = this.variants.reduce((total, variant) => total + variant.stock, 0);
};

// Find variant by SKU
productSchema.methods.findVariantBySku = function(sku) {
  return this.variants.find(v => v.sku === sku);
};

// Check if product has low stock variants
productSchema.methods.getLowStockVariants = function() {
  return this.variants.filter(v => v.stock > 0 && v.stock <= v.lowStockThreshold);
};

// Get out of stock variants
productSchema.methods.getOutOfStockVariants = function() {
  return this.variants.filter(v => v.stock === 0);
};

// Pre-save hook to update total stock
productSchema.pre('save', function(next) {
  if (this.isModified('variants')) {
    this.updateTotalStock();
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default mongoose.models.Product || mongoose.model('Product', productSchema);