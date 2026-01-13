import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/ordersController.js";

const router = express.Router();

router.get("/", protect, getOrders);
router.get("/:id", protect, getOrderById);
router.post("/", protect, createOrder);
router.put("/:id/status", protect, updateOrderStatus);
router.delete("/:id", protect, deleteOrder);

export default router;
