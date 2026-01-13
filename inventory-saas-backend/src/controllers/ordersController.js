import Order from "../models/Order.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import mongoose from "mongoose";

export const getOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query = { tenantId: req.tenantId, deletedAt: null };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate("items.productId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      deletedAt: null,
    }).populate("items.productId", "name");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order fetched", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { customer, items, notes } = req.body;

    if (!items || items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      const variant = product.variants.id(item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      // Check stock
      if (variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name} (${variant.sku}). Available: ${variant.stock}, Requested: ${item.quantity}`
        );
      }

      totalAmount += item.quantity * item.unitPrice;

      // Store previous stock for movement record
      const previousStock = variant.stock;

      // Deduct stock
      variant.stock -= item.quantity;
      await product.save({ session });

      // Create stock movement record
      await StockMovement.create(
        [
          {
            tenantId: req.tenantId,
            productId: item.productId,
            variantId: item.variantId,
            sku: variant.sku,
            movementType: "sale",
            quantity: item.quantity,
            previousStock: previousStock,
            newStock: variant.stock,
            unitPrice: item.unitPrice,
            totalValue: item.quantity * item.unitPrice,
            performedBy: req.user.id,
            referenceType: "Order",
            reason: `Order created`,
          },
        ],
        { session }
      );
    }

    // Generate order number
    const orderCount = await Order.countDocuments({
      tenantId: req.tenantId,
    }).session(session);
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    const order = await Order.create(
      [
        {
          tenantId: req.tenantId,
          orderNumber,
          customer,
          items: items.map((item) => ({
            ...item,
            sku: item.sku || "",
            productName: item.productName || "",
          })),
          totalAmount,
          notes,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const populatedOrder = await Order.findById(order[0]._id).populate(
      "items.productId",
      "name"
    );

    // Emit socket event
    req.app
      .get("io")
      .to(`tenant-${req.tenantId}`)
      .emit("order-created", {
        message: `Order ${orderNumber} created`,
        order: populatedOrder,
      });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !["pending", "processing", "shipped", "delivered", "cancelled"].includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      deletedAt: null,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Handle cancellation - refund stock
    if (status === "cancelled" && order.status !== "cancelled") {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        for (const item of order.items) {
          const product = await Product.findById(item.productId).session(
            session
          );
          const variant = product.variants.id(item.variantId);
          const previousStock = variant.stock;
          variant.stock += item.quantity;
          await product.save({ session });

          await StockMovement.create(
            [
              {
                tenantId: req.tenantId,
                productId: item.productId,
                variantId: item.variantId,
                sku: variant.sku,
                movementType: "return",
                quantity: item.quantity,
                previousStock: previousStock,
                newStock: variant.stock,
                unitPrice: item.unitPrice,
                totalValue: item.quantity * item.unitPrice,
                performedBy: req.user.id,
                referenceType: "Order",
                reason: `Order cancelled - stock refunded`,
              },
            ],
            { session }
          );
        }

        order.status = status;
        await order.save({ session });

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      order.status = status;
      await order.save();
    }

    const updatedOrder = await Order.findById(order._id).populate(
      "items.productId",
      "name"
    );

    // Emit socket event
    req.app
      .get("io")
      .to(`tenant-${req.tenantId}`)
      .emit("order-updated", {
        message: `Order ${order.orderNumber} status changed to ${status}`,
        order: updatedOrder,
      });

    res.json({
      success: true,
      message: "Order status updated",
      data: updatedOrder,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      deletedAt: null,
    }).session(session);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only allow deletion of pending orders
    if (order.status !== "pending") {
      throw new Error("Only pending orders can be deleted");
    }

    // Refund stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      const variant = product.variants.id(item.variantId);
      const previousStock = variant.stock;
      variant.stock += item.quantity;
      await product.save({ session });

      await StockMovement.create(
        [
          {
            tenantId: req.tenantId,
            productId: item.productId,
            variantId: item.variantId,
            sku: variant.sku,
            movementType: "return",
            quantity: item.quantity,
            previousStock: previousStock,
            newStock: variant.stock,
            unitPrice: item.unitPrice,
            totalValue: item.quantity * item.unitPrice,
            performedBy: req.user.id,
            referenceType: "Order",
            reason: `Order deleted - stock refunded`,
          },
        ],
        { session }
      );
    }

    // Soft delete
    order.deletedAt = new Date();
    await order.save({ session });

    await session.commitTransaction();

    // Emit socket event
    req.app
      .get("io")
      .to(`tenant-${req.tenantId}`)
      .emit("order-deleted", {
        message: `Order ${order.orderNumber} deleted`,
        orderId: order._id,
      });

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
