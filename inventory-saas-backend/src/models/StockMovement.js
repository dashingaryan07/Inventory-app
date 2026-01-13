import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  movementType: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'adjustment', 'damage', 'transfer'],
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  totalValue: {
    type: Number
  },
  reason: {
    type: String,
    trim: true
  },
  referenceType: {
    type: String,
    enum: ['Order', 'PurchaseOrder', 'Manual', 'System'],
    default: 'Manual'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance and reporting
stockMovementSchema.index({ tenantId: 1, createdAt: -1 });
stockMovementSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });
stockMovementSchema.index({ tenantId: 1, movementType: 1, createdAt: -1 });
stockMovementSchema.index({ tenantId: 1, sku: 1, createdAt: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);