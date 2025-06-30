# 🚀 LightSpeedPay Setup Instructions

## ✅ Environment Configuration Complete!

All environment variables have been configured for seamless connection between Frontend and Backend.

## 📋 Quick Start

### Option 1: Start Both Servers Automatically (Recommended)
```bash
# Windows users
start-both.bat

# This will automatically:
# 1. Check environment files
# 2. Install dependencies 
# 3. Start backend on port 3100
# 4. Start frontend on port 5173
```

### Option 2: Start Servers Individually

#### Backend Server
```bash
# Windows
start-backend.bat

# Manual command
cd backend
npm install
npm run dev
```

#### Frontend Dashboard
```bash
# Windows  
start-frontend.bat

# Manual command
cd frontend
npm install
npm run dev
```

## 🔗 Connection Details

| Service | URL | Status |
|---------|-----|--------|
| **Backend API** | `http://localhost:3100` | ✅ Configured |
| **Frontend Dashboard** | `http://localhost:5173` | ✅ Configured |
| **Supabase Database** | `https://trmqbpnnboyoneyfleux.supabase.co` | ✅ Connected |

## 📁 Environment Files Created

### Backend (.env.local)
- ✅ Supabase connection configured
- ✅ Port 3100 set
- ✅ All API endpoints ready
- ✅ Worker configurations complete
- ✅ Payment gateway credentials (demo)

### Frontend (.env.local)  
- ✅ Supabase connection configured
- ✅ Backend API URL set to `http://localhost:3100/api/v1`
- ✅ CORS headers configured
- ✅ Development mode enabled

## 🎯 Testing Connection

1. **Start both servers** using `start-both.bat`
2. **Open browser** to `http://localhost:5173`
3. **Check console** for connection status:
   - ✅ `🚀 Frontend-Backend connection established!`
   - ⚠️ `⚠️ Backend not available, running in fallback mode`

## 🔧 API Endpoints Available

All backend APIs are ready and configured:

- **Gateway Management**: `/api/v1/admin/gateways`
- **Queue Management**: `/api/v1/admin/queues`  
- **System Status**: `/api/v1/system/status`
- **Analytics**: `/api/v1/analytics`
- **Transactions**: `/api/v1/transactions`
- **Wallets**: `/api/v1/wallets`
- **Developer Tools**: `/api/v1/merchant/*`

## 🎪 Real-time Features

7 SSE streams are configured and ready:
- Queue metrics stream
- Gateway health stream
- Transaction stream
- System status stream
- Audit logs stream  
- Alerts stream
- Worker health stream

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check if backend is running
curl http://localhost:3100/api/v1/system/status

# Check if frontend can reach backend
# Open browser console at http://localhost:5173
# Look for connection test results
```

### Port Conflicts
- Backend: Change `PORT=3100` in `backend/.env.local`
- Frontend: Change in `vite.config.ts` if needed
- Update `VITE_API_BASE_URL` in `frontend/.env.local`

### Environment Issues
- Ensure both `.env.local` files exist
- Check Supabase credentials are correct
- Verify no syntax errors in environment files

## 🎉 Success Indicators

When everything is working:
1. ✅ Backend starts on port 3100
2. ✅ Frontend starts on port 5173  
3. ✅ Console shows successful connection
4. ✅ Dashboard loads without errors
5. ✅ Real-time data appears in dashboard

## 📞 Next Steps

After successful startup:
1. **Dashboard Access**: `http://localhost:5173`
2. **API Testing**: Use the Developer Tools tab
3. **Real-time Monitoring**: Check the monitoring dashboard
4. **Gateway Management**: Configure payment gateways
5. **Queue Management**: Monitor background workers

---

**Your Frontend can now fully control your Backend! 🎮** 