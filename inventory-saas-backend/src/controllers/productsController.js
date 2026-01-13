import mongoose from "mongoose";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// @desc    Get all products for tenant
// @route   GET /api/products
// @access  Private
export const getProducts = asyncHandler(async (req, res) => {
  const { category, search, lowStock } = req.query;

  const query = { tenantId: req.tenantId, isActive: true };

  // Filter by category
  if (category && category !== "all") {
    query.category = category;
  }

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const products = await Product.find(query).sort({ createdAt: -1 });

  // Filter by low stock if requested
  let filteredProducts = products;
  if (lowStock === "true") {
    filteredProducts = products.filter((product) => {
      return product.variants.some(
        (v) => v.stock > 0 && v.stock <= v.lowStockThreshold
      );
    });
  }

  res.status(200).json({
    success: true,
    count: filteredProducts.length,
    data: filteredProducts,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Create product with variants
// @route   POST /api/products
// @access  Private (Owner, Manager)
export const createProduct = asyncHandler(async (req, res) => {
  // Add tenantId to product data
  req.body.tenantId = req.tenantId;

  const product = await Product.create(req.body);

  // Emit socket event for real-time updates
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("product-created", {
      type: "product-created",
      product: product,
      message: `New product "${product.name}" created`,
    });
  }

  res.status(201).json({
    success: true,
    data: product,
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Owner, Manager)
export const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Don't allow changing tenantId
  delete req.body.tenantId;

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Emit socket event for real-time updates
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("product-updated", {
      type: "product-updated",
      product: product,
      message: `Product "${product.name}" updated`,
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Owner)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!product) {
    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(`tenant-${req.tenantId}`).emit("product-deleted", {
        type: "product-deleted",
        productId: product._id,
        message: `Product "${product.name}" deleted`,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Soft delete - just mark as inactive
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// @desc    Update stock for a variant (WITH CONCURRENCY CONTROL)
// @route   POST /api/products/:id/variants/:variantId/stock
// @access  Private
export const updateStock = asyncHandler(async (req, res) => {
  const { quantity, movementType, reason, notes } = req.body;
  const { id: productId, variantId } = req.params;

  if (!quantity || !movementType) {
    return res.status(400).json({
      success: false,
      message: "Quantity and movement type are required",
    });
  }

  // Use MongoDB transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find product with tenant isolation
    const product = await Product.findOne({
      _id: productId,
      tenantId: req.tenantId,
    }).session(session);

    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find the specific variant
    const variant = product.variants.id(variantId);

    if (!variant) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    // Store previous stock
    const previousStock = variant.stock;

    // Calculate new stock based on movement type
    let newStock;
    if (
      ["purchase", "return", "adjustment"].includes(movementType) &&
      quantity > 0
    ) {
      newStock = previousStock + Math.abs(quantity);
    } else if (["sale", "damage"].includes(movementType)) {
      newStock = previousStock - Math.abs(quantity);
    } else {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid movement type or quantity",
      });
    }

    // CRITICAL: Stock can never be negative
    if (newStock < 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient stock. Cannot reduce stock below zero.",
      });
    }

    // Update stock with optimistic locking (version check)
    const currentVersion = variant.version || 0;
    variant.stock = newStock;
    variant.version = currentVersion + 1;

    await product.save({ session });

    // Record stock movement for audit trail
    await StockMovement.create(
      [
        {
          tenantId: req.tenantId,
          productId: product._id,
          variantId: variant._id,
          sku: variant.sku,
          movementType,
          quantity: Math.abs(quantity),
          previousStock,
          newStock,
          unitPrice: variant.price,
          totalValue: Math.abs(quantity) * variant.price,
          reason,
          notes,
          performedBy: req.user._id,
          referenceType: "Manual",
        },
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: {
        product,
        variant: {
          id: variant._id,
          sku: variant.sku,
          previousStock,
          newStock,
          quantity: Math.abs(quantity),
          movementType,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get stock movements for a product
// @route   GET /api/products/:id/movements
// @access  Private
export const getStockMovements = asyncHandler(async (req, res) => {
  const movements = await StockMovement.find({
    productId: req.params.id,
    tenantId: req.tenantId,
  })
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    count: movements.length,
    data: movements,
  });
});
