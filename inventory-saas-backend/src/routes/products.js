import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getStockMovements
} from '../controllers/productsController.js';
import { protect, authorize } from '../middleware/auth.js';
import { enforceTenantIsolation } from '../middleware/tenantIsolation.js';

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(protect);
router.use(enforceTenantIsolation);

// Product CRUD routes
router.route('/')
  .get(getProducts)
  .post(authorize('Owner', 'Manager'), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('Owner', 'Manager'), updateProduct)
  .delete(authorize('Owner'), deleteProduct);

// Stock management routes
router.post('/:id/variants/:variantId/stock', updateStock);
router.get('/:id/movements', getStockMovements);

export default router;