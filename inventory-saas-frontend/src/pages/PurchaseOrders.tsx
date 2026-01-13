import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";
import { purchaseOrdersAPI, suppliersAPI, productsAPI } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { useToast, ToastContainer } from "../components/Toast";

interface POItem {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity?: number;
  total?: number;
}

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: string;
  items: POItem[];
  subtotal: number;
  totalAmount: number;
  status:
    | "Draft"
    | "Sent"
    | "Confirmed"
    | "Partially Received"
    | "Received"
    | "Cancelled";
  notes?: string;
  createdAt: string;
}

interface Supplier {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  variants: any[];
}

export default function PurchaseOrders() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { socket } = useSocket();
  const { toasts, addToast, removeToast } = useToast();
  const [formData, setFormData] = useState({
    supplierId: "",
    items: [] as POItem[],
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
      const [poRes, suppliersRes, productsRes] = await Promise.all([
        purchaseOrdersAPI.getAll(),
        suppliersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setPos(poRes.data?.data || []);
      setSuppliers(suppliersRes.data?.data || []);
      setProducts(productsRes.data?.data || []);
    } catch (err: any) {
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("po-created", (data) => {
      setPos((prev) => [data.po, ...prev]);
      addToast(data.message, "success");
    });

    socket.on("po-updated", (data) => {
      setPos((prev) => prev.map((p) => (p._id === data.po._id ? data.po : p)));
      addToast(data.message, "success");
    });

    socket.on("po-deleted", (data) => {
      setPos((prev) => prev.filter((p) => p._id !== data.poId));
      addToast(data.message, "success");
    });

    socket.on("po-received", (data) => {
      setPos((prev) => prev.map((p) => (p._id === data.po._id ? data.po : p)));
      addToast(data.message, "success");
    });

    return () => {
      socket.off("po-created");
      socket.off("po-updated");
      socket.off("po-deleted");
      socket.off("po-received");
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

    const newItem: POItem = {
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

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId || formData.items.length === 0) {
      addToast("Please select supplier and add items", "error");
      return;
    }

    try {
      await purchaseOrdersAPI.create({
        supplierId: formData.supplierId,
        items: formData.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: formData.notes,
      });

      setFormData({ supplierId: "", items: [], notes: "" });
      setShowAddModal(false);
    } catch (err: any) {
      addToast(err.response?.data?.message || "Failed to create PO", "error");
    }
  };

  const handleStatusChange = async (poId: string, newStatus: string) => {
    try {
      await purchaseOrdersAPI.updateStatus(poId, newStatus);
    } catch (err: any) {
      addToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (poId: string) => {
    if (!confirm("Delete this PO?")) return;
    try {
      await purchaseOrdersAPI.delete(poId);
    } catch (err: any) {
      addToast("Failed to delete PO", "error");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Create PO
        </button>
      </div>

      {pos.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No purchase orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pos.map((po) => (
            <div
              key={po._id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    PO #{po.poNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {suppliers.find((s) => s._id === po.supplierId)?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      setShowDetailModal(true);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye size={18} className="text-blue-600" />
                  </button>
                  {po.status === "Draft" && (
                    <button
                      onClick={() => handleDelete(po._id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="text-lg font-semibold">{po.items.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-semibold">
                    ${po.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <select
                    value={po.status}
                    onChange={(e) => handleStatusChange(po._id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      po.status === "Received"
                        ? "bg-green-100 text-green-700"
                        : po.status === "Draft"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Partially Received">
                      Partially Received
                    </option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Purchase Order
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Supplier *
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierId: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-6">
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
                              {v.sku}
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
                            {item.quantity} × ${item.unitPrice.toFixed(2)}
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
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
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
                  Create PO
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
