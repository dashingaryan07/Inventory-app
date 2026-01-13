import Supplier from "../models/Supplier.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// @desc    Get all suppliers for tenant
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ tenantId: req.tenantId }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: suppliers.length,
    data: suppliers,
  });
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Supplier not found",
    });
  }

  res.status(200).json({
    success: true,
    data: supplier,
  });
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Owner, Manager)
export const createSupplier = asyncHandler(async (req, res) => {
  req.body.tenantId = req.tenantId;

  const supplier = await Supplier.create(req.body);

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("supplier-created", {
      type: "supplier-created",
      supplier: supplier,
      message: `Supplier "${supplier.name}" added`,
    });
  }

  res.status(201).json({
    success: true,
    data: supplier,
  });
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Owner, Manager)
export const updateSupplier = asyncHandler(async (req, res) => {
  let supplier = await Supplier.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Supplier not found",
    });
  }

  delete req.body.tenantId;

  supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("supplier-updated", {
      type: "supplier-updated",
      supplier: supplier,
      message: `Supplier "${supplier.name}" updated`,
    });
  }

  res.status(200).json({
    success: true,
    data: supplier,
  });
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Owner)
export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Supplier not found",
    });
  }

  // Soft delete
  supplier.isActive = false;
  await supplier.save();

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant-${req.tenantId}`).emit("supplier-deleted", {
      type: "supplier-deleted",
      supplierId: supplier._id,
      message: `Supplier "${supplier.name}" deleted`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Supplier deleted successfully",
  });
});
