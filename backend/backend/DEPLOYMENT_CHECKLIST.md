# 🚀 LightSpeedPay Backend - Railway Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. GitHub Repository Setup
- [ ] Code is committed to `main` branch
- [ ] All sensitive data removed from code
- [ ] `.env.production` template created
- [ ] Railway configuration files present (`railway.json`, `Procfile`)
- [ ] Docker files optimized (`.dockerignore`)

### 2. Local Testing Complete
- [ ] `npm test` passes locally
- [ ] `npm run build` succeeds
- [ ] Health endpoint responds at `/api/health`
- [ ] All critical API endpoints functional
- [ ] Edge Functions tested with Supabase

### 3. Dependencies & Configuration
- [ ] `package.json` optimized for production
- [ ] All required dependencies in `dependencies` (not `devDependencies`)
- [ ] Node.js version >= 18.0.0 specified
- [ ] Railway-specific scripts added

---

## 🔧 Railway Platform Setup

### 1. Account & Project
- [ ] Railway account created and linked to GitHub
- [ ] New project created: "LightSpeedPay Backend"
- [ ] GitHub repository connected
- [ ] Auto-deploy enabled for `main` branch

### 2. Build Configuration
- [ ] **Build Command**: `npm run build`
- [ ] **Start Command**: `npm run start`
- [ ] **Root Directory**: `/backend`
- [ ] **Node Version**: 18.x
- [ ] **Auto-deploy**: Enabled

### 3. Services Setup
- [ ] **Main Service**: Backend API (port 3100)
- [ ] **Redis Service**: Added and configured
- [ ] **Worker Service**: Optional (for background jobs)

---

## 🔑 Environment Variables Configuration

### Required Variables (Critical)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3100`
- [ ] `NEXT_PUBLIC_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] `SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
- [ ] `REDIS_URL=redis://default:password@redis-host:port`
- [ ] `ENCRYPTION_KEY=your_32_character_encryption_key`
- [ ] `JWT_SECRET=your_32_character_jwt_secret`

### BullMQ Configuration
- [ ] `BULLMQ_PREFIX=lightspeed`
- [ ] `MAX_CONCURRENCY_TRANSACTION=25`
- [ ] `MAX_CONCURRENCY_WEBHOOK=50`
- [ ] `MAX_CONCURRENCY_WHATSAPP=30`

### Integration URLs
- [ ] `FRONTEND_URL=https://your-vercel-frontend.vercel.app`
- [ ] `NEXT_PUBLIC_BACKEND_URL=https://your-railway-app.up.railway.app`

### Optional (for full functionality)
- [ ] `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK`
- [ ] `WA_API_URL=https://your-whatsapp-provider.com/api`
- [ ] `WA_API_KEY=your_whatsapp_api_key`

---

## 🚀 Deployment Process

### 1. Initial Deployment
- [ ] Push code to GitHub `main` branch
- [ ] Railway auto-deploys from GitHub
- [ ] Monitor build logs for errors
- [ ] Wait for deployment completion (3-5 minutes)

### 2. Post-Deployment Verification
- [ ] Service shows "Active" status in Railway dashboard
- [ ] Health endpoint accessible: `https://your-app.up.railway.app/api/health`
- [ ] Run verification script: `node scripts/verify-deployment.js YOUR_URL`
- [ ] Check Railway logs for any warnings

### 3. Database Migration & Setup
- [ ] Supabase Edge Functions deployed (from Phase 2)
- [ ] Database tables verified (32 tables)
- [ ] Sample data inserted for testing
- [ ] RPC functions working (`select_gateway_for_amount`)

---

## 🔍 Testing & Validation

### Critical Endpoints Test
- [ ] `GET /api/health` → 200 OK
- [ ] `GET /api/v1/system/status` → 200 OK  
- [ ] `GET /api/v1/admin/gateways` → 200 OK
- [ ] `GET /api/v1/admin/queues` → 200 OK
- [ ] `GET /api/v1/transactions` → 200 OK
- [ ] `GET /api/v1/wallets` → 200 OK

### Performance Verification
- [ ] Response times < 500ms for health endpoints
- [ ] Response times < 2s for data endpoints
- [ ] Memory usage stable
- [ ] No memory leaks observed

### Security Checks
- [ ] CORS headers properly configured
- [ ] Environment variables not exposed
- [ ] Rate limiting functional (if implemented)
- [ ] JWT authentication working

---

## 🔗 Frontend Integration

### Environment Variables for Frontend
```bash
VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api/v1
VITE_BACKEND_URL=https://your-railway-app.up.railway.app
VITE_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Connection Tests
- [ ] Frontend can connect to backend
- [ ] API calls successful from frontend
- [ ] CORS allows frontend domain
- [ ] Real-time features working (if applicable)

---

## 📊 Monitoring & Maintenance

### Railway Dashboard Monitoring
- [ ] CPU usage < 80%
- [ ] Memory usage < 1GB
- [ ] No frequent restarts
- [ ] Build times < 3 minutes

### Application Monitoring
- [ ] Error logs reviewed
- [ ] Performance metrics normal
- [ ] Background workers functional
- [ ] Queue processing operational

### Alerts Setup
- [ ] Railway deployment notifications
- [ ] Slack integration (optional)
- [ ] Health check monitoring
- [ ] Error rate alerts

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

**Build Fails:**
- [ ] Check Node.js version (should be 18.x)
- [ ] Verify package.json scripts
- [ ] Review build logs in Railway

**503 Service Unavailable:**
- [ ] Check environment variables
- [ ] Verify database connection
- [ ] Review startup logs

**CORS Errors:**
- [ ] Update `next.config.js` allowed origins
- [ ] Add frontend domain to CORS
- [ ] Verify headers configuration

**Database Connection Issues:**
- [ ] Check Supabase URL and keys
- [ ] Verify service role permissions
- [ ] Test connection independently

---

## 📞 Support Resources

- **Railway Logs**: Railway Dashboard → Service → Deployments → View Logs
- **Health Check**: `https://your-app.up.railway.app/api/health`
- **Verification Script**: `node scripts/verify-deployment.js YOUR_URL`
- **GitHub Repository**: `https://github.com/shubhamyadav162/lightbackendspeed`

---

## ✅ Deployment Completion Confirmation

Once all items are checked:

- [ ] **Backend deployed successfully to Railway**
- [ ] **All critical endpoints responding**
- [ ] **Database connections active**
- [ ] **Environment variables configured**
- [ ] **Frontend integration ready**
- [ ] **Monitoring setup complete**

**🎉 Backend is production-ready and can handle live traffic!**

---

**Deployment URL**: `https://your-railway-app.up.railway.app`  
**Last Updated**: January 2025  
**Version**: v1.0.0 