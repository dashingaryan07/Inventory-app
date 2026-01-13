import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tenant");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string; tenantId: string }) =>
    api.post("/auth/login", data),

  getMe: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),
};

// Products API
export const productsAPI = {
  getAll: (params?: {
    category?: string;
    search?: string;
    lowStock?: boolean;
  }) => api.get("/products", { params }),

  getById: (id: string) => api.get(`/products/${id}`),

  create: (data: any) => api.post("/products", data),

  update: (id: string, data: any) => api.put(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),

  updateStock: (
    productId: string,
    variantId: string,
    data: {
      quantity: number;
      movementType: string;
      reason?: string;
      notes?: string;
    }
  ) => api.post(`/products/${productId}/variants/${variantId}/stock`, data),

  getMovements: (productId: string) =>
    api.get(`/products/${productId}/movements`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),

  getTopProducts: () => api.get("/dashboard/top-products"),

  getRecentActivity: () => api.get("/dashboard/recent-activity"),

  getStockGraph: () => api.get("/dashboard/stock-graph"),
};

// Suppliers API
export const suppliersAPI = {
  getAll: () => api.get("/suppliers"),

  getById: (id: string) => api.get(`/suppliers/${id}`),

  create: (data: any) => api.post("/suppliers", data),

  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),

  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params?: { status?: string; supplierId?: string }) =>
    api.get("/purchase-orders", { params }),

  getById: (id: string) => api.get(`/purchase-orders/${id}`),

  create: (data: any) => api.post("/purchase-orders", data),

  updateStatus: (id: string, status: string) =>
    api.put(`/purchase-orders/${id}/status`, { status }),

  receiveItems: (id: string, items: any) =>
    api.post(`/purchase-orders/${id}/receive`, { items }),

  delete: (id: string) => api.delete(`/purchase-orders/${id}`),
};

// Orders API
export const ordersAPI = {
  getAll: (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get("/orders", { params }),

  getById: (id: string) => api.get(`/orders/${id}`),

  create: (data: any) => api.post("/orders", data),

  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),

  delete: (id: string) => api.delete(`/orders/${id}`),
};

// Function to fetch dashboard statistics
export const fetchDashboardStats = async () => {
  const response = await fetch("/api/dashboard/stats");
  return response.json();
};

// Function to fetch top products
export const fetchTopProducts = async () => {
  const response = await fetch("/api/dashboard/top-products");
  return response.json();
};

// Function to fetch recent activity
export const fetchRecentActivity = async () => {
  const response = await fetch("/api/dashboard/recent-activity");
  return response.json();
};

// Function to fetch stock graph data
export const fetchStockGraph = async () => {
  const response = await fetch("/api/dashboard/stock-graph");
  return response.json();
};

// Function to fetch all products
export const fetchProducts = async () => {
  const response = await fetch("/api/products");
  return response.json();
};

// Function to fetch a specific product by ID
export const fetchProductById = async (id: any) => {
  const response = await fetch(`/api/products/${id}`);
  return response.json();
};

// Function to create a new product
export const createProduct = async (productData: any) => {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  return response.json();
};

// Function to update a product by ID
export const updateProduct = async (id: any, productData: any) => {
  const response = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  return response.json();
};

// Function to delete a product by ID
export const deleteProduct = async (id: any) => {
  const response = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// Function to update stock for a product
export const updateStock = async (id: any, stockData: any) => {
  const response = await fetch(`/api/products/${id}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stockData),
  });
  return response.json();
};

// Function to fetch stock movements for a product
export const fetchStockMovements = async (id: any) => {
  const response = await fetch(`/api/products/${id}/stock-movements`);
  return response.json();
};

export default api;
