# InventoryHub SaaS - Deployment Guide

## Overview

This guide covers deploying the InventoryHub SaaS application with:

- **Frontend**: Deployed on Vercel (React/Vite)
- **Backend**: Deployed on Railway/Render (Node.js/Express)
- **Database**: MongoDB Atlas

## Frontend Deployment (Vercel)

### Prerequisites

1. GitHub account with repository pushed
2. Vercel account (https://vercel.com)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Deploy Frontend on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Select your repository
4. Configure project:

   - **Framework**: Vite
   - **Root Directory**: `inventory-saas-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:

   - `VITE_API_URL`: (e.g., `https://inventory-api.railway.app/api`)

6. Click "Deploy"

The frontend will be available at: `https://your-project.vercel.app`

---

## Backend Deployment (Recommended: Railway)

Railway is perfect for Node.js apps and supports:

- Environment variables
- MongoDB connections
- Automatic deployments from GitHub

### Step 1: Deploy on Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect GitHub and select your repository
4. Select `inventory-saas-backend` as root directory
5. Wait for build completion

### Step 2: Configure Environment Variables in Railway

In Railway dashboard, go to "Variables" and add:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
JWT_SECRET=your-super-secret-key-change-this
FRONTEND_URL=https://your-project.vercel.app
```

**Get MongoDB URI:**

1. Go to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string and replace `<username>`, `<password>`, and `<database>`

### Step 3: Update Frontend API URL

In Vercel dashboard:

1. Go to your project settings
2. Update `VITE_API_URL` to your Railway backend URL (e.g., `https://inventory-api.railway.app/api`)

---

## Alternative Backend Deployment Options

### Option 2: Render (Similar to Railway)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Set `inventory-saas-backend` as root directory
5. Add environment variables (same as Railway)
6. Deploy

### Option 3: Fly.io

1. Install Fly CLI: `brew install flyctl` (or from https://fly.io/docs/getting-started/)
2. Create account at https://fly.io
3. In backend directory: `flyctl launch`
4. Follow prompts and set environment variables
5. Deploy: `flyctl deploy`

---

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create new organization or log in
3. Create a new project
4. Click "Build a Database"
5. Choose "Shared" (free tier)
6. Select region closest to your backend
7. Create cluster (this takes 2-3 minutes)

### Step 2: Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Enter username and generate secure password
4. Set role to "Atlas Admin"
5. Save and copy credentials

### Step 3: Configure Network Access

1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0) for production, or enter specific IPs
4. Confirm

### Step 4: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Update `MONGODB_URI` in your backend environment variables

---

## Post-Deployment Verification

### 1. Test Backend Health

```bash
curl https://your-backend-url/health
```

Should return:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-14T..."
}
```

### 2. Test Frontend

- Visit your Vercel deployment URL
- Check browser console for errors
- Verify API calls work (Network tab)
- Test login functionality

### 3. Real-time Features

- Open in multiple browsers
- Create a product in one, check if it appears in another
- Verify Socket.IO connection in DevTools

---

## Environment Variables Checklist

### Frontend (.env)

```
VITE_API_URL=https://your-backend-api.com/api
```

### Backend (.env)

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory-app
JWT_SECRET=your-secret-key-minimum-32-chars
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## Troubleshooting

### Frontend not connecting to backend

- Check `VITE_API_URL` matches backend URL
- Verify CORS is enabled on backend (`FRONTEND_URL` env var)
- Check browser console for network errors

### Socket.IO connection fails

- Ensure backend URL includes `/socket.io` endpoint
- Check that `FRONTEND_URL` matches frontend deployment
- Verify backend is running and listening on correct port

### MongoDB connection error

- Verify `MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user credentials are correct

### Build fails on Vercel/Railway

- Check that Node version is compatible (14+)
- Verify all dependencies are listed in package.json
- Check build logs in deployment dashboard

---

## Monitoring & Logs

### Vercel

- Deployment logs: Dashboard → Project → Deployments
- Runtime logs: Dashboard → Project → Functions

### Railway

- Real-time logs: Dashboard → Project → Logs

### MongoDB Atlas

- Query logs: Collections → Explain Plan
- Activity: Activity → Query Profiler

---

## Security Best Practices

1. **Never commit .env files** - Use environment variables in deployment platform
2. **Use strong JWT_SECRET** - Minimum 32 characters
3. **Enable HTTPS** - Both Vercel and Railway use HTTPS by default
4. **Rotate credentials** - Change passwords regularly
5. **Monitor logs** - Watch for unusual activity
6. **Rate limiting** - Consider adding rate limiting middleware
7. **CORS policy** - Keep `FRONTEND_URL` specific (not `*`)

---

## Rollback Procedure

### Vercel

1. Dashboard → Project → Deployments
2. Find previous working deployment
3. Click dropdown → "Redeploy"

### Railway

1. Dashboard → Project → Deployments
2. Click on previous deployment
3. Click "Redeploy"

---

## Support

For more help:

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://railway.app/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Express.js Docs: https://expressjs.com
