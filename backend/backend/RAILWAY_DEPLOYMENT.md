# 🚀 Railway Deployment Guide

## 🎯 **Automatic Deployment Setup**

This repository is configured for **automatic Railway deployment** with all credentials included.

### **✅ What's Already Configured:**

1. **Environment Variables** → `.env.production` (included in repo)
2. **Redis Service** → `railway.json` (auto-adds Redis)
3. **Docker Build** → `Dockerfile` (optimized for Railway)
4. **Health Checks** → `/api/health` endpoint
5. **Supabase Integration** → All credentials included

---

## 🚀 **Deployment Steps (2 Minutes):**

### **Step 1: Connect GitHub**
1. Go to **https://railway.app**
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `lightbackendspeed` repository
5. Click **"Deploy"**

### **Step 2: Add Redis Service**
1. In Railway dashboard, click **"Add Service"**
2. Select **"Database"** → **"Redis"**
3. Redis will auto-connect with `${{Redis.REDIS_URL}}`

### **Step 3: Wait for Deployment**
```bash
✅ Railway detects Dockerfile
✅ Builds with environment variables
✅ Starts Redis service automatically  
✅ Health check passes at /api/health
✅ Deployment successful!
```

---

## 🔗 **Automatic URLs:**

### **Your API will be available at:**
```bash
Base URL: https://YOUR_PROJECT_NAME.up.railway.app
Health: https://YOUR_PROJECT_NAME.up.railway.app/api/health
Admin: https://YOUR_PROJECT_NAME.up.railway.app/api/v1/admin/gateways
```

---

## ✅ **Environment Variables (Already Included):**

```env
# Supabase Configuration ✅
SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
SUPABASE_SERVICE_KEY=[INCLUDED]
DATABASE_URL=[INCLUDED]

# Redis Configuration ✅
REDIS_URL=${{Redis.REDIS_URL}} # Railway auto-connects

# Authentication ✅
NEXTAUTH_SECRET=[INCLUDED]
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}} # Railway auto-fills

# PSP Configuration ✅
RAZORPAY_KEY_ID=rzp_test_K5jcxeFtYgGmRb
RAZORPAY_KEY_SECRET=81AVgu72Yqo452FvV6SLsT3k
```

---

## 🎯 **Expected Build Process:**

### **Railway Logs Will Show:**
```bash
🚀 Starting LightSpeedPay Backend...
📋 Loading production environment variables...
🔨 Loading build-time environment...
🔨 Building Next.js application...
✅ Build completed successfully
🌟 Starting production server...
✅ Server listening on port 3000
✅ Health check passed
```

---

## 🔧 **Post-Deployment:**

### **Test Your API:**
```bash
# Health Check
curl https://YOUR_PROJECT.up.railway.app/api/health

# Gateway API
curl https://YOUR_PROJECT.up.railway.app/api/v1/admin/gateways
```

---

## 🚨 **Troubleshooting:**

### **If Build Fails:**
1. Check Railway logs for specific errors
2. Verify Redis service is running
3. Check environment variable loading

### **If Health Check Fails:**
1. Verify port 3000 is exposed
2. Check if API routes are accessible
3. Verify Supabase connection

---

## 📊 **Status Dashboard:**

After deployment, you can monitor:
- **Build Logs** → Railway dashboard
- **Runtime Logs** → Railway dashboard  
- **Health Status** → `/api/health`
- **API Documentation** → Available endpoints

---

## 🎉 **Success Indicators:**

```bash
✅ Deployment status: "DEPLOYED"
✅ Health check: Returns 200 OK
✅ Redis: Connected and operational
✅ Supabase: Database queries working
✅ API routes: All endpoints accessible
```

---

**🚀 Ready for Production!**

Once deployed, your LightSpeedPay backend will be fully operational with:
- ✅ Complete payment gateway APIs
- ✅ Background workers ready
- ✅ Real-time monitoring
- ✅ Enterprise security
- ✅ Supabase integration 