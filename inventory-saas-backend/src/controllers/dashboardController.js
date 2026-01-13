import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  // Get all products for this tenant
  const products = await Product.find({ tenantId, isActive: true });

  // Calculate statistics
  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  
  // Calculate total inventory value
  const totalInventoryValue = products.reduce((sum, product) => {
    const productValue = product.variants.reduce((variantSum, variant) => {
      return variantSum + (variant.stock * variant.price);
    }, 0);
    return sum + productValue;
  }, 0);

  // Count low stock items (considering pending POs)
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const lowStockItems = [];

  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.stock === 0) {
        outOfStockCount++;
        lowStockItems.push({
          productId: product._id,
          productName: product.name,
          variantId: variant._id,
          sku: variant.sku,
          attributes: Object.fromEntries(variant.attributes),
          currentStock: variant.stock,
          threshold: variant.lowStockThreshold,
          status: 'critical'
        });
      } else if (variant.stock <= variant.lowStockThreshold) {
        lowStockCount++;
        lowStockItems.push({
          productId: product._id,
          productName: product.name,
          variantId: variant._id,
          sku: variant.sku,
          attributes: Object.fromEntries(variant.attributes),
          currentStock: variant.stock,
          threshold: variant.lowStockThreshold,
          status: 'warning'
        });
      }
    }
  }

  // Get orders this month (from stock movements)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const ordersThisMonth = await StockMovement.countDocuments({
    tenantId,
    movementType: 'sale',
    createdAt: { $gte: startOfMonth }
  });

  // Calculate percentage changes (mock for demo)
  const stats = {
    totalProducts: {
      value: totalProducts,
      change: '+12.5%',
      isPositive: true
    },
    lowStockItems: {
      value: lowStockCount,
      change: '-8.2%',
      isPositive: true
    },
    totalInventoryValue: {
      value: totalInventoryValue,
      change: '+18.7%',
      isPositive: true
    },
    ordersThisMonth: {
      value: ordersThisMonth,
      change: '+24.3%',
      isPositive: true
    },
    outOfStockItems: outOfStockCount
  };

  res.status(200).json({
    success: true,
    data: {
      stats,
      lowStockItems: lowStockItems.slice(0, 10) // Return top 10
    }
  });
});

// @desc    Get top selling products (last 30 days)
// @route   GET /api/dashboard/top-products
// @access  Private
export const getTopProducts = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Aggregate sales from stock movements
  const topProducts = await StockMovement.aggregate([
    {
      $match: {
        tenantId,
        movementType: 'sale',
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalSales: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalValue' }
      }
    },
    {
      $sort: { totalSales: -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $project: {
        productName: '$product.name',
        sales: '$totalSales',
        revenue: '$totalRevenue',
        trend: 'up' // In real app, compare with previous period
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: topProducts
  });
});

// @desc    Get recent activity
// @route   GET /api/dashboard/recent-activity
// @access  Private
export const getRecentActivity = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  // Get recent stock movements
  const recentMovements = await StockMovement.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('performedBy', 'name')
    .select('movementType sku quantity createdAt performedBy');

  // Get recent purchase orders
  const recentPOs = await PurchaseOrder.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('poNumber status createdAt');

  // Combine and format activities
  const activities = [];

  recentMovements.forEach(movement => {
    let action = '';
    let icon = 'Package';
    let color = 'text-blue-500';

    switch (movement.movementType) {
      case 'sale':
        action = `Sold ${movement.quantity} units of ${movement.sku}`;
        icon = 'ShoppingCart';
        color = 'text-green-500';
        break;
      case 'purchase':
        action = `Received ${movement.quantity} units of ${movement.sku}`;
        icon = 'CheckCircle';
        color = 'text-green-500';
        break;
      case 'adjustment':
        action = `Stock adjusted for ${movement.sku}`;
        icon = 'Edit';
        color = 'text-orange-500';
        break;
      default:
        action = `${movement.movementType} - ${movement.sku}`;
    }

    activities.push({
      action,
      time: movement.createdAt,
      icon,
      color,
      type: 'movement'
    });
  });

  recentPOs.forEach(po => {
    activities.push({
      action: `Purchase Order ${po.poNumber} - ${po.status}`,
      time: po.createdAt,
      icon: 'FileText',
      color: 'text-purple-500',
      type: 'purchase_order'
    });
  });

  // Sort by time
  activities.sort((a, b) => b.time - a.time);

  res.status(200).json({
    success: true,
    data: activities.slice(0, 10)
  });
});

// @desc    Get stock movement graph data (last 7 days)
// @route   GET /api/dashboard/stock-graph
// @access  Private
export const getStockGraph = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const movements = await StockMovement.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$movementType'
        },
        count: { $sum: '$quantity' }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);

  // Format data for chart
  const graphData = movements.reduce((acc, item) => {
    const date = item._id.date;
    if (!acc[date]) {
      acc[date] = { date, purchases: 0, sales: 0 };
    }
    
    if (item._id.type === 'purchase') {
      acc[date].purchases = item.count;
    } else if (item._id.type === 'sale') {
      acc[date].sales = item.count;
    }
    
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: Object.values(graphData)
  });
});