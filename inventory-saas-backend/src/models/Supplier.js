import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
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
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentTerms: {
    type: String,
    enum: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'COD'],
    default: 'Net 30'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
supplierSchema.index({ tenantId: 1, name: 1 });
supplierSchema.index({ tenantId: 1, isActive: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);