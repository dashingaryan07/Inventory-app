import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { dashboardAPI } from "../utils/api";

const Dashboard = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats
        let statsData: any = {};
        let lowStockData: any[] = [];
        try {
          const statsRes = await dashboardAPI.getStats();
          console.log("Stats Response:", statsRes);
          statsData = statsRes.data?.data?.stats || statsRes.data?.stats || {};
          lowStockData = statsRes.data?.data?.lowStockItems || [];
        } catch (statsErr) {
          console.error("Stats API error:", statsErr);
        }

        // Fetch top products
        let topProductsData: any[] = [];
        try {
          const topRes = await dashboardAPI.getTopProducts();
          console.log("Top Products Response:", topRes);
          topProductsData = topRes.data?.data || topRes.data || [];
        } catch (topErr) {
          console.error("Top Products API error:", topErr);
        }

        // Fetch recent activity
        let recentActivityData: any[] = [];
        try {
          const recentRes = await dashboardAPI.getRecentActivity();
          console.log("Recent Activity Response:", recentRes);
          recentActivityData = recentRes.data?.data || recentRes.data || [];
        } catch (recentErr) {
          console.error("Recent Activity API error:", recentErr);
        }

        // Build stats array from response
        const statsArray = [
          {
            title: "Total Products",
            value: statsData?.totalProducts?.value || 0,
            change: statsData?.totalProducts?.change || "",
            isPositive: statsData?.totalProducts?.isPositive !== false,
            icon: Package,
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
          },
          {
            title: "Low Stock Items",
            value: statsData?.lowStockItems?.value || 0,
            change: statsData?.lowStockItems?.change || "",
            isPositive: statsData?.lowStockItems?.isPositive !== false,
            icon: AlertTriangle,
            bgColor: "bg-orange-50",
            textColor: "text-orange-600",
          },
          {
            title: "Total Inventory Value",
            value: `$${statsData?.totalInventoryValue?.value || 0}`,
            change: statsData?.totalInventoryValue?.change || "",
            isPositive: statsData?.totalInventoryValue?.isPositive !== false,
            icon: DollarSign,
            bgColor: "bg-green-50",
            textColor: "text-green-600",
          },
          {
            title: "Orders This Month",
            value: statsData?.ordersThisMonth?.value || 0,
            change: statsData?.ordersThisMonth?.change || "",
            isPositive: statsData?.ordersThisMonth?.isPositive !== false,
            icon: TrendingUp,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
          },
        ];

        console.log("Setting state with:", {
          statsArray,
          lowStockData,
          topProductsData,
          recentActivityData,
        });
        setStats(statsArray);
        setLowStockProducts(lowStockData);
        setTopProducts(topProductsData);
        setRecentActivity(recentActivityData);
      } catch (err: any) {
        console.error("Error loading dashboard:", err);
        setError(`Failed to load dashboard: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          <h3 className="font-bold mb-2">Error loading dashboard:</h3>
          <p>{error}</p>
          <p className="text-sm mt-2">
            Check browser console (F12) for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your inventory today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon size={24} className={stat.textColor} />
              </div>
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${
                  stat.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.isPositive ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Low Stock Alerts
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Items that need immediate attention
              </p>
            </div>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              {lowStockProducts.filter((p) => p.status === "critical").length}{" "}
              Critical
            </span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 && (
              <div className="text-sm text-gray-600">No low stock items</div>
            )}
            {lowStockProducts.map((product: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {product.productName}
                  </h3>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p
                    className={`text-lg font-bold ${
                      product.status === "critical"
                        ? "text-red-600"
                        : "text-orange-600"
                    }`}
                  >
                    {product.currentStock} / {product.threshold}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.status === "critical"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {product.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity: any, idx: number) => {
              const getIcon = (actionType: string) => {
                if (
                  actionType?.includes("PO") ||
                  actionType?.includes("received")
                )
                  return CheckCircle;
                if (
                  actionType?.includes("alert") ||
                  actionType?.includes("low")
                )
                  return AlertTriangle;
                if (
                  actionType?.includes("order") ||
                  actionType?.includes("ORD")
                )
                  return Package;
                return Clock;
              };

              const getColor = (actionType: string) => {
                if (
                  actionType?.includes("PO") ||
                  actionType?.includes("received")
                )
                  return "text-green-500";
                if (
                  actionType?.includes("alert") ||
                  actionType?.includes("low")
                )
                  return "text-orange-500";
                if (
                  actionType?.includes("order") ||
                  actionType?.includes("ORD")
                )
                  return "text-blue-500";
                return "text-gray-500";
              };

              const Icon = getIcon(activity.description || activity.action);
              const color = getColor(activity.description || activity.action);

              return (
                <div key={idx} className="flex gap-3">
                  <div className={`p-2 rounded-lg bg-gray-50 h-fit`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">
                      {activity.description || activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp || activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-4 text-purple-600 hover:text-purple-700 font-semibold text-sm py-2 hover:bg-purple-50 rounded-lg transition-colors">
            View All Activity
          </button>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Top Selling Products
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Last 30 days performance
            </p>
          </div>
          <button className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold text-sm transition-colors">
            View Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Product
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                  Sales
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                  Revenue
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-sm text-gray-600"
                  >
                    No product data available
                  </td>
                </tr>
              )}
              {topProducts.map((product: any, idx: number) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center font-bold text-purple-600">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-gray-900">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900">
                    {product.unitsSold || 0}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900">
                    ${product.totalRevenue || 0}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                      <ArrowUpRight size={16} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
