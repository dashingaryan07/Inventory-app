import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route imports
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import dashboardRoutes from "./routes/dashboard.js";
import suppliersRoutes from "./routes/suppliers.js";
import purchaseOrderRoutes from "./routes/purchaseOrders.js";
import ordersRoutes from "./routes/orders.js";

const app = express();

// Create HTTP server and attach Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  next();
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join tenant-specific room
  socket.on("join-tenant", (tenantId) => {
    socket.join(`tenant-${tenantId}`);
    console.log(
      `📍 Socket ${socket.id} joined tenant room: tenant-${tenantId}`
    );
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set("io", io);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Request logging middleware (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/orders", ordersRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "InventoryHub API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      dashboard: "/api/dashboard",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 InventoryHub API Server         ║
║   📍 Environment: ${process.env.NODE_ENV || "development"}            ║
║   🌐 Server running on port ${PORT}      ║
║   📡 API: http://localhost:${PORT}       ║
║   🔌 WebSocket enabled                ║
╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
