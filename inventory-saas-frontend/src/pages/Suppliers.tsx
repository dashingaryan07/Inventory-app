import { useEffect, useState } from "react";
import { Users, Plus, Edit, Trash2, X } from "lucide-react";
import { suppliersAPI } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { useToast, ToastContainer } from "../components/Toast";

interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  paymentTerms?: string;
  isActive: boolean;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { socket } = useSocket();
  const { toasts, addToast, removeToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    paymentTerms: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await suppliersAPI.getAll();
      setSuppliers(res.data?.data || []);
    } catch (err: any) {
      addToast("Failed to load suppliers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("supplier-created", (data) => {
      setSuppliers((prev) => [data.supplier, ...prev]);
      addToast(data.message, "success");
    });

    socket.on("supplier-updated", (data) => {
      setSuppliers((prev) =>
        prev.map((s) => (s._id === data.supplier._id ? data.supplier : s))
      );
      addToast(data.message, "success");
    });

    socket.on("supplier-deleted", (data) => {
      setSuppliers((prev) => prev.filter((s) => s._id !== data.supplierId));
      addToast(data.message, "success");
    });

    return () => {
      socket.off("supplier-created");
      socket.off("supplier-updated");
      socket.off("supplier-deleted");
    };
  }, [socket, addToast]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      addToast("Supplier name is required", "error");
      return;
    }

    try {
      const supplier = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        paymentTerms: formData.paymentTerms,
      };

      await suppliersAPI.create(supplier);
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "",
        paymentTerms: "",
      });
      setShowAddModal(false);
    } catch (err: any) {
      addToast(
        err.response?.data?.message || "Failed to add supplier",
        "error"
      );
    }
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !editingId) {
      addToast("Supplier name is required", "error");
      return;
    }

    try {
      const supplier = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        paymentTerms: formData.paymentTerms,
      };

      await suppliersAPI.update(editingId, supplier);
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "",
        paymentTerms: "",
      });
      setEditingId(null);
      setShowEditModal(false);
    } catch (err: any) {
      addToast(
        err.response?.data?.message || "Failed to update supplier",
        "error"
      );
    }
  };

  const handleEditClick = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      street: supplier.address?.street || "",
      city: supplier.address?.city || "",
      state: supplier.address?.state || "",
      country: supplier.address?.country || "",
      paymentTerms: supplier.paymentTerms || "",
    });
    setEditingId(supplier._id);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      await suppliersAPI.delete(id);
    } catch (err: any) {
      addToast("Failed to delete supplier", "error");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add Supplier
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            No suppliers yet. Add your first supplier!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {supplier.name}
                  </h3>
                  {supplier.contactPerson && (
                    <p className="text-sm text-gray-600">
                      Contact: {supplier.contactPerson}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    {supplier.email && (
                      <span className="text-gray-600">📧 {supplier.email}</span>
                    )}
                    {supplier.phone && (
                      <span className="text-gray-600">📱 {supplier.phone}</span>
                    )}
                  </div>
                  {supplier.address?.city && (
                    <p className="text-sm text-gray-600 mt-2">
                      📍 {supplier.address.street}, {supplier.address.city},{" "}
                      {supplier.address.state}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(supplier)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} className="text-purple-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier._id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-auto max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Supplier</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Supplier Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Contact Person"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Street"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Payment Terms"
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData({ ...formData, paymentTerms: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-3 pt-4">
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
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-auto max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Edit Supplier
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSupplier} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Supplier Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Contact Person"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Street"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Payment Terms"
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData({ ...formData, paymentTerms: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg"
                >
                  Save
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
