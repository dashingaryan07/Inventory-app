# InventoryHub SaaS - Quick Start Deployment

## 🚀 Quick Deploy Steps

### Step 1: Prepare Your GitHub Repository

```bash
cd E:\Inventory-app
git init
git add .
git commit -m "Initial commit: InventoryHub SaaS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-hub.git
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel (5 minutes)

1. **Go to** https://vercel.com/new
2. **Connect GitHub** - Select your `inventory-hub` repository
3. **Project Setup:**

   - Framework: **Vite**
   - Root Directory: **inventory-saas-frontend**
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables** - Add after deployment:

   - Key: `VITE_API_URL`
   - Value: `https://inventory-backend.railway.app/api` (update after backend deployment)

5. **Deploy** ✅

**Frontend URL:** `https://inventory-hub-xxx.vercel.app`

---

### Step 3: Deploy Backend to Railway (5 minutes)

1. **Go to** https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Connect** your GitHub account
4. **Select** your repository
5. **Root Directory:** `inventory-saas-backend`
6. **Wait** for build to complete

7. **Add Environment Variables** in Railway Dashboard:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/inventory-app
JWT_SECRET=generate-a-random-32-char-string-here
FRONTEND_URL=https://inventory-hub-xxx.vercel.app
```

**Backend URL:** `https://inventory-backend-xxx.railway.app`

---

### Step 4: Update Frontend API URL

1. **Go to** Vercel Dashboard
2. **Select your project**
3. **Settings** → **Environment Variables**
4. **Update** `VITE_API_URL`:
   ```
   https://inventory-backend-xxx.railway.app/api
   ```
5. **Redeploy** project

---

### Step 5: Setup MongoDB Atlas (Free)

1. **Go to** https://www.mongodb.com/cloud/atlas
2. **Create Account** (or login)
3. **Create Project**
4. **Build Database** → **Shared** (Free)
5. **Create Database User:**
   - Username: `inventory_user`
   - Password: Generate secure password
6. **Network Access:** Add `0.0.0.0/0`
7. **Connect** → Copy connection string
8. **Update** `MONGODB_URI` in Railway with your credentials

---

## ✅ Verification Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables set in both Vercel and Railway
- [ ] Backend URL updated in Vercel
- [ ] Frontend URL updated in Railway
- [ ] Test health endpoint: `https://your-backend.railway.app/health`
- [ ] Test login on deployed frontend
- [ ] Verify Socket.IO real-time updates work
- [ ] Check browser console for errors

---

## 📝 Important Notes

1. **JWT_SECRET**: Generate a random string (at least 32 characters)

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **CORS**: The `FRONTEND_URL` environment variable handles CORS configuration

3. **Free Tier Limits**:

   - Vercel: Unlimited deployments
   - Railway: $5/month free tier
   - MongoDB Atlas: 512MB free storage

4. **First Deployment**: May take 5-10 minutes for initial build

---

## 🔍 Troubleshooting

### Frontend won't connect to backend

- ❌ Check `VITE_API_URL` is correct
- ❌ Verify backend is running: visit health endpoint
- ❌ Check CORS settings in Railway environment variables

### Build fails on Vercel

- ❌ Check Node version compatibility
- ❌ View build logs in Vercel dashboard
- ❌ Ensure all dependencies are in package.json

### Database connection error

- ❌ Verify MongoDB URI is correct
- ❌ Check IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)
- ❌ Test connection string locally first

### Socket.IO not connecting

- ❌ Verify `FRONTEND_URL` in Railway matches Vercel URL
- ❌ Check browser console for connection errors
- ❌ Ensure WebSocket is not blocked by firewall

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:

- Alternative deployment options (Render, Fly.io)
- Docker setup
- Monitoring and logging
- Security best practices
- Rollback procedures

---

## 🆘 Need Help?

- **Vercel Issues**: https://vercel.com/docs
- **Railway Issues**: https://railway.app/docs
- **MongoDB Issues**: https://docs.atlas.mongodb.com
- **Backend API Docs**: Run backend locally and visit http://localhost:5000

---

## 🎉 After Deployment

Your InventoryHub SaaS is now live!

**Features available:**

- ✅ Multi-tenant inventory management
- ✅ Product variants with stock tracking
- ✅ Real-time updates via Socket.IO
- ✅ Supplier management
- ✅ Purchase order workflow
- ✅ Order management
- ✅ Dashboard with analytics

**Next steps:**

1. Create your first tenant
2. Add products and variants
3. Start tracking inventory in real-time
4. Invite team members
5. Monitor analytics dashboard

---

**Happy deploying! 🚀**
