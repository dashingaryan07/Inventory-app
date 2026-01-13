import express from "express";
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePOStatus,
  receivePOItems,
  deletePurchaseOrder,
} from "../controllers/purchaseOrdersController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// CRUD routes
router.get("/", getPurchaseOrders);
router.get("/:id", getPurchaseOrder);
router.post("/", createPurchaseOrder);
router.delete("/:id", deletePurchaseOrder);

// Status and receiving routes
router.put("/:id/status", updatePOStatus);
router.post("/:id/receive", receivePOItems);

export default router;
