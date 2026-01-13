import mongoose from "mongoose";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import StockMovement from "../models/StockMovement.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// @desc    Get all purchase orders for tenant
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const { status, supplierId } = req.query;

  const query = { tenantId: req.tenantId };

  if (status) query.status = status;
  if (supplierId) query.supplierId = supplierId;

  const pos = await PurchaseOrder.find(query)
    .populate("supplierId", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: pos.length,
    data: pos,
  });
});

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  }).populate("supplierId", "name email phone");

  if (!po) {
    return res.status(404).json({
      success: false,
      message: "Purchase Order not found",
    });
  }

  res.status(200).json({
    success: true,
    data: po,
  });
});

// @desc    Create purchase order
// @route   POST /api/purchase-orders
// @access  Private
export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplierId, items, notes } = req.body;

  if (!supplierId || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Supplier and items are required",
    });
  }

  // Get supplier name
  const supplier = await Supplier.findOne({
    _id: supplierId,
    tenantId: req.tenantId,
  });
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Supplier not found",
    });
  }

  // Calculate totals
  let subtotal = 0;
  const poItems = [];

  for (const item of items) {
    const product = await Product.findOne({
      _id: item.productId,
      tenantId: req.tenantId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found: ${item.productId}`,
      });
    }

    const variant = product.variants.id(item.variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: `Variant not found for product ${product.name}`,
      });
    }

    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;

    poItems.push({
      productId: item.productId,
      variantId: item.variantId,
      sku: variant.sku,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: itemTotal,
    });
  }

  // Generate PO number
  const poCount = await PurchaseOrder.countDocuments({
    tenantId: req.tenantId,
  });
  const poNumber = `PO-${Date.now()}-${poCount + 1}`;

  // Calculate total amount (subtotal + tax + shipping)
  const tax = 0; // Default to 0, can be passed in body if needed
  const shippingCost = 0; // Default to 0, can be passed in body if needed
  const totalAmount = subtotal + tax + shippingCost;

  const po = await PurchaseOrder.create({
    tenantId: req.tenantId,
    supplierId,
    supplierName: supplier.name || "Unknown",
    poNumber,
    items: poItems,
    subtotal,
    tax,
    shippingCost,
    totalAmount,
    status: "Draft",
    notes,
    createdBy: req.user.id,
  });

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("po-created", {
      type: "po-created",
      po: po,
      message: `Purchase Order #${po.poNumber} created`,
    });
  }

  res.status(201).json({
    success: true,
    data: po,
  });
});

// @desc    Update purchase order status
// @route   PUT /api/purchase-orders/:id/status
// @access  Private
export const updatePOStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = [
    "Draft",
    "Sent",
    "Confirmed",
    "Partially Received",
    "Received",
    "Cancelled",
  ];
  const statusMap = {
    draft: "Draft",
    sent: "Sent",
    confirmed: "Confirmed",
    "partially-received": "Partially Received",
    received: "Received",
    cancelled: "Cancelled",
  };

  const capitalizedStatus = statusMap[status.toLowerCase()] || status;

  if (!validStatuses.includes(capitalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status",
    });
  }

  let po = await PurchaseOrder.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!po) {
    return res.status(404).json({
      success: false,
      message: "Purchase Order not found",
    });
  }

  po.status = capitalizedStatus;
  po.updatedAt = new Date();
  await po.save();

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("po-updated", {
      type: "po-updated",
      po: po,
      message: `Purchase Order #${po.poNumber} status changed to ${capitalizedStatus}`,
    });
  }

  res.status(200).json({
    success: true,
    data: po,
  });
});

// @desc    Receive items from purchase order (partial or full)
// @route   POST /api/purchase-orders/:id/receive
// @access  Private
export const receivePOItems = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{variantId, receivedQuantity}, ...]

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Items to receive are required",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).session(session);

    if (!po) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    if (po.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cannot receive items from cancelled PO",
      });
    }

    // Update each item
    for (const receiveItem of items) {
      const poItem = po.items.find(
        (i) => i.variantId.toString() === receiveItem.variantId
      );

      if (!poItem) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Item not found in PO: ${receiveItem.variantId}`,
        });
      }

      const receivedQty = receiveItem.receivedQuantity;
      if (receivedQty > poItem.quantity - poItem.receivedQuantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Received quantity exceeds ordered quantity for ${poItem.sku}`,
        });
      }

      // Update PO item
      poItem.receivedQuantity += receivedQty;

      // Update product stock
      const product = await Product.findById(poItem.productId).session(session);
      const variant = product.variants.id(poItem.variantId);
      variant.stock += receivedQty;
      await product.save({ session });

      // Create stock movement record
      await StockMovement.create(
        [
          {
            tenantId: req.tenantId,
            productId: poItem.productId,
            variantId: poItem.variantId,
            sku: poItem.sku,
            movementType: "purchase",
            quantity: receivedQty,
            notes: `Received from PO #${po.poNumber}`,
            userId: req.user.id,
            referenceId: po._id,
            referenceType: "PurchaseOrder",
          },
        ],
        { session }
      );
    }

    // Update PO status if fully received
    const allReceived = po.items.every(
      (item) => item.receivedQuantity === item.quantity
    );
    if (allReceived) {
      po.status = "received";
    }

    po.updatedAt = new Date();
    await po.save({ session });

    await session.commitTransaction();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`tenant-${req.tenantId}`).emit("po-received", {
        type: "po-received",
        po: po,
        message: `Items received for Purchase Order #${po.poNumber}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Items received successfully",
      data: po,
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Delete purchase order (only draft POs)
// @route   DELETE /api/purchase-orders/:id
// @access  Private
export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!po) {
    return res.status(404).json({
      success: false,
      message: "Purchase Order not found",
    });
  }

  if (po.status !== "draft") {
    return res.status(400).json({
      success: false,
      message: "Can only delete draft purchase orders",
    });
  }

  await PurchaseOrder.findByIdAndDelete(req.params.id);

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("po-deleted", {
      type: "po-deleted",
      poId: po._id,
      message: `Purchase Order #${po.poNumber} deleted`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Purchase Order deleted successfully",
  });
});
