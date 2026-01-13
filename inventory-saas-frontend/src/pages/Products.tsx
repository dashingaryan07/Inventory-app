import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  X,
} from "lucide-react";
import { productsAPI } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { useToast, ToastContainer } from "../components/Toast";

interface ProductVariant {
  id: string;
  sku: string;
  attributes: { [key: string]: string }; // e.g., { size: 'L', color: 'Red' }
  stock: number;
  price: number;
  lowStockThreshold: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  variants: ProductVariant[];
  totalStock: number;
  imageUrl: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const { socket, isConnected } = useSocket();
  const { toasts, addToast, removeToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    basePrice: "",
    imageUrl: "📦",
  });
  const [variants, setVariants] = useState<any[]>([]);
  const [currentVariant, setCurrentVariant] = useState({
    sku: "",
    price: "",
    stock: "",
    lowStockThreshold: "10",
    attributeKey: "",
    attributeValue: "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getAll();

        // Access nested data structure from backend response
        const productList = res.data?.data || res.data || [];
        setProducts(productList);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(productList.map((p: any) => p.category).filter(Boolean))
        );
        setCategories(["all", ...uniqueCategories]);
      } catch (err: any) {
        console.error("Error loading products:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for product created
    socket.on("product-created", (data) => {
      console.log("Product created:", data);
      setProducts((prev) => [data.product, ...prev]);
      addToast(data.message, "success");
    });

    // Listen for product updated
    socket.on("product-updated", (data) => {
      console.log("Product updated:", data);
      setProducts((prev) =>
        prev.map((p) => (p._id === data.product._id ? data.product : p))
      );
      addToast(data.message, "success");
    });

    // Listen for product deleted
    socket.on("product-deleted", (data) => {
      console.log("Product deleted:", data);
      setProducts((prev) => prev.filter((p) => p._id !== data.productId));
      addToast(data.message, "success");
    });

    return () => {
      socket.off("product-created");
      socket.off("product-updated");
      socket.off("product-deleted");
    };
  }, [socket, addToast]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productsAPI.delete(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.basePrice) {
      alert("Please fill in all required fields");
      return;
    }

    if (variants.length === 0) {
      alert("Please add at least one variant");
      return;
    }

    try {
      const newProduct = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        variants: variants.map((v) => ({
          sku: v.sku,
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
          lowStockThreshold: parseInt(v.lowStockThreshold),
          attributes: v.attributes,
        })),
      };
      const res = await productsAPI.create(newProduct);

      // Add new product to list
      if (res.data?.data) {
        setProducts([res.data.data, ...products]);
      }

      // Reset form
      setFormData({
        name: "",
        category: "",
        description: "",
        basePrice: "",
        imageUrl: "📦",
      });
      setVariants([]);
      setCurrentVariant({
        sku: "",
        price: "",
        stock: "",
        lowStockThreshold: "10",
        attributeKey: "",
        attributeValue: "",
      });
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Error adding product:", err);
      alert("Failed to add product: " + (err.message || "Unknown error"));
    }
  };

  const handleAddVariant = () => {
    if (
      !currentVariant.sku ||
      !currentVariant.price ||
      currentVariant.stock === ""
    ) {
      alert("Please fill in SKU, price, and stock");
      return;
    }

    const attributes: any = {};
    if (currentVariant.attributeKey && currentVariant.attributeValue) {
      attributes[currentVariant.attributeKey] = currentVariant.attributeValue;
    }

    const newVariant = {
      ...currentVariant,
      attributes,
      id: Date.now().toString(), // temporary ID for display
    };

    setVariants([...variants, newVariant]);
    setCurrentVariant({
      sku: "",
      price: "",
      stock: "",
      lowStockThreshold: "10",
      attributeKey: "",
      attributeValue: "",
    });
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleEditClick = (product: Product) => {
    console.log("Edit clicked for product:", product);
    setEditingProductId(product._id || product.id);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      basePrice: product.basePrice.toString(),
      imageUrl: product.imageUrl,
    });

    // Convert existing variants to editable format
    const editableVariants = product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price.toString(),
      stock: v.stock.toString(),
      lowStockThreshold: v.lowStockThreshold.toString(),
      attributes: v.attributes,
      attributeKey: Object.keys(v.attributes)[0] || "",
      attributeValue: Object.values(v.attributes)[0] || "",
    }));
    setVariants(editableVariants);
    setShowEditModal(true);
    console.log("Edit modal should be open now");
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.category ||
      !formData.basePrice ||
      !editingProductId
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (variants.length === 0) {
      alert("Please ensure at least one variant exists");
      return;
    }

    try {
      const updatedProduct = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
          lowStockThreshold: parseInt(v.lowStockThreshold),
          attributes: v.attributes,
        })),
      };
      const res = await productsAPI.update(editingProductId, updatedProduct);

      // Update product in list - use _id for comparison since backend returns MongoDB IDs
      if (res.data?.data) {
        setProducts(
          products.map((p) =>
            (p._id || p.id) === editingProductId ? res.data.data : p
          )
        );
      }

      // Reset form
      setFormData({
        name: "",
        category: "",
        description: "",
        basePrice: "",
        imageUrl: "📦",
      });
      setVariants([]);
      setCurrentVariant({
        sku: "",
        price: "",
        stock: "",
        lowStockThreshold: "10",
        attributeKey: "",
        attributeValue: "",
      });
      setEditingProductId(null);
      setShowEditModal(false);
    } catch (err: any) {
      console.error("Error updating product:", err);
      alert("Failed to update product: " + (err.message || "Unknown error"));
    }
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0)
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700",
        icon: AlertCircle,
      };
    if (stock <= threshold)
      return {
        label: "Low Stock",
        color: "bg-orange-100 text-orange-700",
        icon: AlertCircle,
      };
    return {
      label: "In Stock",
      color: "bg-green-100 text-green-700",
      icon: CheckCircle,
    };
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Products & Inventory
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your products, variants, and stock levels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 text-gray-600">Loading products...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Products</span>
                <Package size={20} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {products.length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Variants</span>
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {products.reduce((acc, p) => acc + p.variants.length, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Low Stock Items</span>
                <AlertCircle size={20} className="text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {products.reduce(
                  (acc, p) =>
                    acc +
                    p.variants.filter(
                      (v) => v.stock <= v.lowStockThreshold && v.stock > 0
                    ).length,
                  0
                )}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Out of Stock</span>
                <TrendingDown size={20} className="text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {products.reduce(
                  (acc, p) =>
                    acc + p.variants.filter((v) => v.stock === 0).length,
                  0
                )}
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <Filter size={18} />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-6">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                    {product.imageUrl}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleEditClick(product)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} className="text-purple-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() =>
                            handleDelete(product._id || product.id)
                          }
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {product.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        Base Price:{" "}
                        <span className="font-semibold text-gray-900">
                          ${product.basePrice}
                        </span>
                      </span>
                      <span className="text-sm text-gray-600">
                        Total Stock:{" "}
                        <span className="font-semibold text-gray-900">
                          {product.totalStock}
                        </span>
                      </span>
                    </div>

                    {/* Variants Table */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package size={16} />
                        Variants ({product.variants.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {product.variants.map((variant) => {
                          const status = getStockStatus(
                            variant.stock,
                            variant.lowStockThreshold
                          );
                          return (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {variant.sku}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {Object.entries(variant.attributes)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(" • ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-gray-900">
                                  ${variant.price}
                                </span>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">
                                    {variant.stock} units
                                  </p>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}
                                  >
                                    <status.icon size={12} />
                                    {status.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                No products found matching your criteria
              </p>
            </div>
          )}

          {/* Add Product Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full mx-auto max-h-screen overflow-y-auto flex flex-col">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-8 pb-6 flex items-center justify-between mb-0">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Add New Product
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({
                        name: "",
                        category: "",
                        description: "",
                        basePrice: "",
                        imageUrl: "📦",
                      });
                      setVariants([]);
                      setCurrentVariant({
                        sku: "",
                        price: "",
                        stock: "",
                        lowStockThreshold: "10",
                        attributeKey: "",
                        attributeValue: "",
                      });
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>

                <form
                  onSubmit={handleAddProduct}
                  id="add-product-form"
                  className="flex-1 overflow-y-auto"
                >
                  <div className="px-8 py-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="e.g., iPhone 14 Pro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category *
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="e.g., Smartphones"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="Product description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product Icon/Emoji
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, imageUrl: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-2xl text-center"
                        placeholder="📦"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter an emoji (1-2 characters)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Base Price (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            basePrice: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Add Variants *
                      </h3>

                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={currentVariant.sku}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                sku: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                            placeholder="e.g., MBA-M2-8GB-SLV"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={currentVariant.price}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  price: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Stock
                            </label>
                            <input
                              type="number"
                              value={currentVariant.stock}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  stock: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Low Stock Threshold
                          </label>
                          <input
                            type="number"
                            value={currentVariant.lowStockThreshold}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                lowStockThreshold: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                            placeholder="10"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Attribute (e.g., size)
                            </label>
                            <input
                              type="text"
                              value={currentVariant.attributeKey}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  attributeKey: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="size"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Value (e.g., L)
                            </label>
                            <input
                              type="text"
                              value={currentVariant.attributeValue}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  attributeValue: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="L"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors text-sm"
                        >
                          + Add Variant
                        </button>
                      </div>

                      {variants.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                          {variants.map((variant, idx) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between text-sm mb-2 pb-2 border-b last:border-b-0"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {variant.sku}
                                </p>
                                <p className="text-xs text-gray-600">
                                  ${variant.price} • Stock: {variant.stock}
                                  {Object.keys(variant.attributes).length > 0 &&
                                    ` • ${Object.entries(variant.attributes)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(", ")}`}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(variant.id)}
                                className="text-red-600 hover:text-red-700 font-semibold text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </form>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-8 pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    form="add-product-form"
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {showEditModal && editingProductId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full mx-auto max-h-screen overflow-y-auto flex flex-col">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-8 pb-6 flex items-center justify-between mb-0">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Product
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProductId(null);
                      setFormData({
                        name: "",
                        category: "",
                        description: "",
                        basePrice: "",
                        imageUrl: "📦",
                      });
                      setVariants([]);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>

                <form
                  onSubmit={handleEditProduct}
                  id="edit-product-form"
                  className="flex-1 overflow-y-auto"
                >
                  <div className="px-8 py-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="e.g., iPhone 14 Pro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category *
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="e.g., Smartphones"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="Product description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product Icon/Emoji
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, imageUrl: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-2xl text-center"
                        placeholder="📦"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter an emoji (1-2 characters)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Base Price (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            basePrice: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Variants *
                      </h3>

                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={currentVariant.sku}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                sku: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                            placeholder="e.g., MBA-M2-8GB-SLV"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={currentVariant.price}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  price: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Stock
                            </label>
                            <input
                              type="number"
                              value={currentVariant.stock}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  stock: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Low Stock Threshold
                          </label>
                          <input
                            type="number"
                            value={currentVariant.lowStockThreshold}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                lowStockThreshold: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                            placeholder="10"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Attribute (e.g., size)
                            </label>
                            <input
                              type="text"
                              value={currentVariant.attributeKey}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  attributeKey: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="size"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Value (e.g., L)
                            </label>
                            <input
                              type="text"
                              value={currentVariant.attributeValue}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  attributeValue: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
                              placeholder="L"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors text-sm"
                        >
                          + Add Variant
                        </button>
                      </div>

                      {variants.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                          {variants.map((variant, idx) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between text-sm mb-2 pb-2 border-b last:border-b-0"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {variant.sku}
                                </p>
                                <p className="text-xs text-gray-600">
                                  ${variant.price} • Stock: {variant.stock}
                                  {Object.keys(variant.attributes).length > 0 &&
                                    ` • ${Object.entries(variant.attributes)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(", ")}`}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(variant.id)}
                                className="text-red-600 hover:text-red-700 font-semibold text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </form>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-8 pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProductId(null);
                      setFormData({
                        name: "",
                        category: "",
                        description: "",
                        basePrice: "",
                        imageUrl: "📦",
                      });
                      setVariants([]);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    form="edit-product-form"
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Products;
