import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Eye, Trash2, X } from "lucide-react";
import { ordersAPI, productsAPI } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { useToast, ToastContainer } from "../components/Toast";

interface OrderItem {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  variants: any[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { socket } = useSocket();
  const { toasts, addToast, removeToast } = useToast();
  const [formData, setFormData] = useState({
    customer: { name: "", email: "", phone: "", address: "" },
    items: [] as OrderItem[],
    notes: "",
  });
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    variantId: "",
    quantity: "",
    unitPrice: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setOrders(ordersRes.data?.data || []);
      setProducts(productsRes.data?.data || []);
    } catch (err: any) {
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("order-created", (data) => {
      setOrders((prev) => [data.order, ...prev]);
      addToast(data.message, "success");
    });

    socket.on("order-updated", (data) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === data.order._id ? data.order : o))
      );
      addToast(data.message, "success");
    });

    socket.on("order-deleted", (data) => {
      setOrders((prev) => prev.filter((o) => o._id !== data.orderId));
      addToast(data.message, "success");
    });

    return () => {
      socket.off("order-created");
      socket.off("order-updated");
      socket.off("order-deleted");
    };
  }, [socket, addToast]);

  const handleAddItem = () => {
    if (
      !currentItem.productId ||
      !currentItem.variantId ||
      !currentItem.quantity ||
      !currentItem.unitPrice
    ) {
      addToast("Please fill all item fields", "error");
      return;
    }

    const product = products.find((p) => p._id === currentItem.productId);
    const variant = product?.variants.find(
      (v) => v._id === currentItem.variantId
    );

    const newItem: OrderItem = {
      productId: currentItem.productId,
      variantId: currentItem.variantId,
      sku: variant?.sku || "",
      productName: product?.name || "",
      quantity: parseInt(currentItem.quantity),
      unitPrice: parseFloat(currentItem.unitPrice),
      total: parseInt(currentItem.quantity) * parseFloat(currentItem.unitPrice),
    };

    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setCurrentItem({
      productId: "",
      variantId: "",
      quantity: "",
      unitPrice: "",
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer.name || formData.items.length === 0) {
      addToast("Please enter customer name and add items", "error");
      return;
    }

    try {
      await ordersAPI.create({
        customer: formData.customer,
        items: formData.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sku: item.sku,
          productName: item.productName,
        })),
        notes: formData.notes,
      });

      setFormData({
        customer: { name: "", email: "", phone: "", address: "" },
        items: [],
        notes: "",
      });
      setShowAddModal(false);
    } catch (err: any) {
      addToast(
        err.response?.data?.message || "Failed to create order",
        "error"
      );
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
    } catch (err: any) {
      addToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Delete this order? (Only pending orders can be deleted)"))
      return;
    try {
      await ordersAPI.delete(orderId);
    } catch (err: any) {
      addToast(
        err.response?.data?.message || "Failed to delete order",
        "error"
      );
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const totalOrderValue = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Create Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalOrderValue.toFixed(2)}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600">{order.customer.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.customer.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetailModal(true);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye size={18} className="text-blue-600" />
                  </button>
                  {order.status === "pending" && (
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="text-lg font-semibold">{order.items.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-semibold">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-semibold">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className={`px-3 py-1 rounded-full text-sm font-semibold cursor-pointer ${
                      statusColors[order.status]
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create Order</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={formData.customer.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer: {
                          ...formData.customer,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.customer.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer: {
                          ...formData.customer,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.customer.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer: {
                          ...formData.customer,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={formData.customer.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer: {
                          ...formData.customer,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Add Items</h3>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Product
                    </label>
                    <select
                      value={currentItem.productId}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          productId: e.target.value,
                          variantId: "",
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentItem.productId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Variant
                      </label>
                      <select
                        value={currentItem.variantId}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            variantId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select variant</option>
                        {products
                          .find((p) => p._id === currentItem.productId)
                          ?.variants.map((v) => (
                            <option key={v._id} value={v._id}>
                              {v.sku} (Stock: {v.stock})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      step="0.01"
                      value={currentItem.unitPrice}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          unitPrice: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold"
                  >
                    + Add Item
                  </button>
                </div>

                {formData.items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {formData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm bg-white p-2 rounded border"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-xs text-gray-600">
                            {item.quantity} × ${item.unitPrice.toFixed(2)} = $
                            {item.total?.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              items: prev.items.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-red-600 hover:text-red-700 ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <p className="font-bold text-right">
                        Total: $
                        {formData.items
                          .reduce((sum, item) => sum + (item.total || 0), 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
