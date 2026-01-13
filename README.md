# InventoryHub SaaS 📦

A modern, multi-tenant SaaS inventory management system built with React, Node.js, and MongoDB.

## 🌟 Features

### Core Inventory Management

- **Product Management** - Create products with multiple variants and SKUs
- **Stock Tracking** - Real-time stock level monitoring with movement history
- **Product Variants** - Support for different variants (size, color, etc.) with individual stock levels
- **Low Stock Alerts** - Visual indicators for products running low on inventory

### Supplier Management

- **Supplier Directory** - Manage supplier information and contact details
- **Purchase Order System** - Create and track purchase orders
- **Order Status Tracking** - Monitor PO status from Draft → Received
- **Partial Receipt** - Support for partial deliveries and back-orders

### Order Processing

- **Order Management** - Create and manage customer orders
- **Stock Reservation** - Automatic stock deduction on order creation
- **Order Status Workflow** - Pending → Processing → Shipped → Delivered
- **Order Cancellation** - With automatic stock refund

### Real-Time Features

- **Socket.IO Integration** - Live updates across all connected users
- **Real-Time Notifications** - Toast notifications for all operations
- **Multi-User Sync** - See changes instantly in real-time
- **Tenant Isolation** - Secure multi-tenant architecture

### Dashboard Analytics

- **Stock Overview** - Total products and low-stock alerts
- **Performance Metrics** - Sales and inventory statistics
- **Recent Activity** - Timeline of recent operations
- **Quick Stats** - Key performance indicators at a glance

## 🏗️ Architecture

```
InventoryHub/
├── inventory-saas-frontend/     # React/Vite frontend
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── context/             # React Context (Auth, Socket.IO)
│   │   └── utils/               # Utility functions & API client
│   └── package.json
│
├── inventory-saas-backend/      # Node.js/Express backend
│   ├── src/
│   │   ├── models/              # MongoDB schemas
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/          # Auth, error handling
│   │   └── server.js            # Express app & Socket.IO
│   ├── Dockerfile               # Docker configuration
│   └── package.json
│
├── DEPLOYMENT.md                # Detailed deployment guide
├── QUICK_DEPLOY.md              # Quick start deployment
└── docker-compose.yml           # Local development setup
```

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing
- **Lucide Icons** - Beautiful icon library

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Token-based authentication
- **Docker** - Containerization

### Infrastructure

- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting
- **MongoDB Atlas** - Managed MongoDB
- **Docker** - Local development

## 🚀 Quick Start

### Local Development

1. **Clone repository**

   ```bash
   git clone https://github.com/your-username/inventory-hub.git
   cd inventory-hub
   ```

2. **Setup Backend**

   ```bash
   cd inventory-saas-backend
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **Setup Frontend** (new terminal)

   ```bash
   cd inventory-saas-frontend
   npm install
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - API: http://localhost:5000/api

### Environment Variables

**Backend (.env)**

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory-app
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**

```
VITE_API_URL=http://localhost:5000/api
```

## 📋 API Documentation

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### Products

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Suppliers

- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchase Orders

- `GET /api/purchase-orders` - List purchase orders
- `POST /api/purchase-orders` - Create PO
- `PUT /api/purchase-orders/:id/status` - Update PO status
- `POST /api/purchase-orders/:id/receive` - Receive items

### Orders

- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Dashboard

- `GET /api/dashboard/stats` - Overview statistics
- `GET /api/dashboard/top-products` - Top performing products
- `GET /api/dashboard/recent-activity` - Recent operations

## 🔐 Security Features

- **Multi-Tenant Isolation** - Complete data separation per tenant
- **JWT Authentication** - Secure token-based auth
- **CORS Configuration** - Restricted cross-origin requests
- **Password Hashing** - Secure password storage
- **Soft Deletes** - Data preservation and audit trail
- **Transaction Support** - ACID compliance for critical operations
- **Input Validation** - Server-side validation on all inputs
- **Rate Limiting Ready** - Can add rate limiting middleware

## 📊 Data Models

### Product

- SKU, name, description
- Multiple variants (size, color, etc.)
- Stock levels per variant
- Pricing information
- Category tracking

### Supplier

- Contact information
- Payment terms
- Address details
- Performance metrics

### Purchase Order

- Auto-generated PO number
- Supplier reference
- Multiple line items
- Status tracking (Draft → Received)
- Partial receipt support
- Tax and shipping costs

### Order

- Auto-generated order number
- Customer information
- Multiple line items
- Stock reservation
- Status tracking
- Cancellation with refund

### Stock Movement

- Type tracking (sale, purchase, return, adjustment)
- Previous/new stock levels
- User attribution
- Timestamp audit trail
- Reference to source (Order, PO, etc.)

## 🔄 Real-Time Features

### Socket.IO Events

**Products**

- `product-created` - New product added
- `product-updated` - Product modified
- `product-deleted` - Product deleted

**Suppliers**

- `supplier-created` - New supplier added
- `supplier-updated` - Supplier modified
- `supplier-deleted` - Supplier deleted

**Purchase Orders**

- `po-created` - New PO created
- `po-updated` - PO status changed
- `po-deleted` - PO deleted
- `po-received` - Items received

**Orders**

- `order-created` - New order created
- `order-updated` - Order status changed
- `order-deleted` - Order deleted

## 📈 Deployment

### Quick Deploy (5-10 minutes)

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for step-by-step instructions:

1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Setup MongoDB Atlas
4. Configure environment variables

### Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:

- Detailed setup instructions
- Alternative deployment options
- Monitoring and logging
- Security best practices

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create products with variants
- [ ] Check real-time updates with multiple browsers
- [ ] Create purchase orders
- [ ] Receive PO items and verify stock updates
- [ ] Create orders and verify stock deduction
- [ ] Cancel order and verify stock refund
- [ ] Check stock movement history
- [ ] Verify dashboard analytics

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Frontend won't connect to backend**

- Verify `VITE_API_URL` is correct
- Check backend is running on port 5000
- Check browser console for CORS errors

**Database connection fails**

- Verify MongoDB is running (local) or connection string (Atlas)
- Check credentials in .env file
- Ensure IP is whitelisted in MongoDB Atlas

**Socket.IO not connecting**

- Verify backend Socket.IO is enabled
- Check browser console for connection errors
- Verify frontend URL is correct in backend

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: See DEPLOYMENT.md and QUICK_DEPLOY.md

## 🎯 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Inventory forecasting
- [ ] Automated reordering
- [ ] Integration with accounting software
- [ ] Mobile app
- [ ] API key management
- [ ] Custom workflows
- [ ] Barcode scanning
- [ ] Multi-warehouse support
- [ ] Audit compliance reports

## ✨ Credits

Built with ❤️ by the InventoryHub Team

---

**Ready to deploy?** Start with [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

**Want detailed setup?** Check [DEPLOYMENT.md](./DEPLOYMENT.md)

**Let's get started! 🚀**
