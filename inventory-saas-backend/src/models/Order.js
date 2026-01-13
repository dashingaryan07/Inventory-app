import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variantId: mongoose.Schema.Types.ObjectId,
        sku: String,
        productName: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        _id: false,
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    notes: String,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
