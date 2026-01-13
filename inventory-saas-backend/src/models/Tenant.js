import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date
  },
  settings: {
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    lowStockThreshold: { type: Number, default: 10 }
  }
}, {
  timestamps: true
});

// Indexes for performance
tenantSchema.index({ tenantId: 1 });
tenantSchema.index({ email: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);

export default mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);