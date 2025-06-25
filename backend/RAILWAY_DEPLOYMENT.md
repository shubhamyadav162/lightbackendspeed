# 🚀 LightSpeedPay Backend - Railway Deployment Guide

## 📋 Pre-Requirements

Before deploying to Railway, ensure you have:

- ✅ GitHub repository: `github.com/shubhamyadav162/lightbackendspeed`
- ✅ Railway account with GitHub connected
- ✅ Supabase project with Edge Functions deployed
- ✅ Redis instance (Railway can provide this)

---

## 🛠 Railway Deployment Steps

### Step 1: Connect GitHub Repository

1. **Login to Railway**: https://railway.app/
2. **New Project** → **Deploy from GitHub repo**
3. **Select Repository**: `shubhamyadav162/lightbackendspeed`
4. **Root Directory**: `/backend` (important!)

### Step 2: Configure Build Settings

Railway will auto-detect the Node.js project using **nixpacks.toml**:

```bash
Build Command:    Automated via nixpacks.toml
Start Command:    npm run start  
Install Command:  npm ci
Root Directory:   /backend
Node.js Version:  20.x (specified in .nvmrc)
```

**Files that configure Railway build:**
- ✅ `nixpacks.toml` - Specifies Node.js 20 and build commands
- ✅ `.nvmrc` - Node.js version specification
- ✅ `railway.json` - Railway-specific configuration
- ✅ `Procfile` - Process definitions

### Step 3: Add Redis Service

1. **In Railway Dashboard** → **Add Service** → **Database** → **Redis**
2. **Copy the Redis URL** from the Redis service variables
3. **Format**: `redis://default:password@hostname:port`

### Step 4: Set Environment Variables

**Critical Variables** (copy from `.env.production`):

```bash
# Core Configuration
NODE_ENV=production
PORT=3100

# Supabase (Update SERVICE_ROLE_KEY)
NEXT_PUBLIC_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk
SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY

# Redis (Use Railway Redis URL)
REDIS_URL=redis://default:password@redis-hostname:port

# Security (Generate 32-char keys)
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-32-character-jwt-secret

# BullMQ
BULLMQ_PREFIX=lightspeed
MAX_CONCURRENCY_TRANSACTION=25
MAX_CONCURRENCY_WEBHOOK=50
MAX_CONCURRENCY_WHATSAPP=30

# Frontend Connection
FRONTEND_URL=https://your-vercel-frontend.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://your-railway-domain.up.railway.app
```

### Step 5: Deploy Main API Service

1. **Deploy** the main service (this will be your API server)
2. **Wait for build completion**
3. **Check logs** for any errors
4. **Test the health endpoint**: `https://your-app.up.railway.app/api/health`

### Step 6: Deploy Worker Services (Optional)

For high-volume processing, deploy workers separately:

1. **Add New Service** → **GitHub Repo** → Same repository
2. **Root Directory**: `/backend`
3. **Start Command**: `npm run workers:railway`
4. **Same Environment Variables** as main service

---

## 🔧 Custom Domain Setup (Optional)

1. **Railway Dashboard** → **Settings** → **Networking**
2. **Custom Domain** → Add your domain
3. **DNS Configuration**: Point CNAME to Railway URL

---

## 📊 Post-Deployment Verification

### Test API Endpoints

```bash
# Health Check
curl https://your-app.up.railway.app/api/health

# Gateway Management (with auth)
curl https://your-app.up.railway.app/api/v1/admin/gateways \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Queue Stats
curl https://your-app.up.railway.app/api/v1/admin/queues \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Worker Status

**Railway Logs** will show:
```
✅ Worker Health Monitor started
✅ Queue Metrics Recorder started  
✅ Transaction Processor started
✅ Webhook Retry Worker started
```

### Verify Database Connection

**Supabase Dashboard** should show:
```
✅ Edge Functions responding
✅ Database connections active
✅ RLS policies working
```

---

## 🚨 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Check Node version
Node: >=18.0.0 required

# Check dependencies
npm install should complete without errors
```

**Port Issues:**
```bash
# Railway auto-assigns PORT
Start command: npm run start (uses PORT env var)
```

**Environment Variables Missing:**
```bash
# Critical variables must be set:
- SUPABASE_SERVICE_ROLE_KEY
- REDIS_URL  
- ENCRYPTION_KEY
- JWT_SECRET
```

**Workers Not Starting:**
```bash
# Deploy workers as separate service with:
Start Command: npm run workers:railway
```

### Log Analysis

**Railway Logs Location**: 
- Dashboard → Service → **Deployments** → **View Logs**

**Key Log Messages**:
```
✅ "Server started on port 3100"
✅ "Connected to Supabase"  
✅ "Redis connection established"
✅ "Workers initialized"
```

---

## 🔗 Integration with Frontend

### Frontend Environment Variables

Update your **Vercel frontend** with:

```bash
# Point to Railway backend
VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api/v1
VITE_BACKEND_URL=https://your-railway-app.up.railway.app

# Supabase (same as backend)
VITE_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### CORS Configuration

The backend is pre-configured to accept requests from:
- `localhost:5173` (development)
- Your Vercel frontend domain (production)

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Redis service running and connected
- [ ] Supabase Edge Functions deployed
- [ ] Health endpoint responding
- [ ] Worker processes running
- [ ] Frontend can connect to API
- [ ] Database migrations applied
- [ ] SSL certificate active (Railway auto-provides)
- [ ] Custom domain configured (if needed)
- [ ] Monitoring and logging working

---

## 📞 Support

If deployment fails:

1. **Check Railway Logs** first
2. **Verify Environment Variables** against `.env.production`
3. **Test Supabase Connection** independently
4. **Check Redis connectivity**

**Your backend will be available at**: `https://your-app-name.up.railway.app`

---

**🎉 Ready for production traffic!** 