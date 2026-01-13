import mongoose from 'mongoose';

const poItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const purchaseOrderSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  poNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  items: [poItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
purchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ tenantId: 1, supplierId: 1 });

// Calculate totals
purchaseOrderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.tax + this.shippingCost;
};

// Check if fully received
purchaseOrderSchema.methods.isFullyReceived = function() {
  return this.items.every(item => item.receivedQuantity >= item.quantity);
};

// Check if partially received
purchaseOrderSchema.methods.isPartiallyReceived = function() {
  return this.items.some(item => item.receivedQuantity > 0 && item.receivedQuantity < item.quantity);
};

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);