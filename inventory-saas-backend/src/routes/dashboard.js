import express from 'express';
import {
  getDashboardStats,
  getTopProducts,
  getRecentActivity,
  getStockGraph
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { enforceTenantIsolation } from '../middleware/tenantIsolation.js';

const router = express.Router();

// Apply authentication and tenant isolation
router.use(protect);
router.use(enforceTenantIsolation);

router.get('/stats', getDashboardStats);
router.get('/top-products', getTopProducts);
router.get('/recent-activity', getRecentActivity);
router.get('/stock-graph', getStockGraph);

export default router;