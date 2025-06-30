# 🚀 Railway Environment Variables Setup Guide

## ❌ **समस्या**: Critical Environment Variables Missing

आपकी Railway deployment इसलिए fail हो रही है क्योंकि essential environment variables properly set नहीं हैं।

---

## ✅ **Solution**: Complete Environment Variables Setup

### **🔥 STEP 1: Railway Dashboard में Environment Variables Add करें**

Railway project dashboard में जाकर **"Variables"** tab में ये सभी variables add करें:

### **🔴 CRITICAL VARIABLES (Missing/Wrong)**

```env
# Supabase Configuration
SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.70v06Ypqm8iMPOXiBjQiBET40kgw2rvMT18OFr7_xlE
NEXT_PUBLIC_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk

# Redis (Railway Integration)
REDIS_URL=${{Redis.REDIS_URL}}

# Encryption (32-byte hex string)
ENCRYPTION_KEY=f37e01ce219e79c7cc4b319ee5aebc3e5a93ccc7573cb195c4b4ed658d339ecc

# Next.js URLs
NEXT_PUBLIC_BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=lightspeedpay-super-secret-key-32-chars-minimum-for-security
```

### **🟡 BullMQ & Workers**

```env
# BullMQ Configuration
BULLMQ_PREFIX=lightspeed
MAX_CONCURRENCY_TRANSACTION=25
MAX_CONCURRENCY_WEBHOOK=50
MAX_CONCURRENCY_WHATSAPP=30

# Worker Intervals
HEALTH_MONITOR_INTERVAL_MS=60000
HEALTH_STALE_THRESHOLD_MS=120000
LOW_BALANCE_SCAN_INTERVAL_MS=300000
WEBHOOK_RETRY_INTERVAL_MS=60000
```

### **🟢 Payment Gateways (Test Keys)**

```env
# Razorpay Test
RAZORPAY_KEY_ID=rzp_test_K5jcxeFtYgGmRb
RAZORPAY_KEY_SECRET=81AVgu72Yqo452FvV6SLsT3k
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# PayU Test
PAYU_KEY_ID=your_payu_test_key
PAYU_KEY_SECRET=your_payu_test_secret
PAYU_SALT=your_payu_salt
```

### **🔵 Optional (For Full Features)**

```env
# WhatsApp Integration
WA_API_URL=https://your-whatsapp-provider.com/api
WA_API_KEY=your_whatsapp_api_key
WA_TEMPLATE_LOW_BALANCE=low_balance_template

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Monitoring
PUBLIC_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
SLA_MONITOR_ENDPOINTS=
```

---

## 🔧 **STEP 2: Railway Redis Service Add करें**

1. Railway dashboard में **"New Service"** click करें
2. **"Database"** → **"Redis"** select करें  
3. Redis service automatic connect हो जाएगी `${{Redis.REDIS_URL}}` के through

---

## 🎯 **STEP 3: Supabase Service Role Key Fix करें**

### **Get Correct Service Role Key:**

1. **Supabase Dashboard** → https://supabase.com/dashboard/project/trmqbpnnboyoneyfleux
2. **Settings** → **API**
3. **Service Role** key copy करें (service_role secret)
4. Railway में `SUPABASE_SERVICE_ROLE_KEY` variable में paste करें

---

## 🔐 **STEP 4: Generate Encryption Key**

### **Create 32-byte Hex Key:**

```bash
# Method 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: OpenSSL
openssl rand -hex 32

# Method 3: Python
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## ✅ **Expected Working Configuration**

### **Railway Variables Should Look Like:**

```
NODE_ENV = production
PORT = 3000
SUPABASE_URL = https://trmqbpnnboyoneyfleux.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.70v06Ypqm8iMPOXiBjQiBET40kgw2rvMT18OFr7_xlE
NEXT_PUBLIC_SUPABASE_URL = https://trmqbpnnboyoneyfleux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk
REDIS_URL = ${{Redis.REDIS_URL}}
ENCRYPTION_KEY = f37e01ce219e79c7cc4b319ee5aebc3e5a93ccc7573cb195c4b4ed658d339ecc
NEXTAUTH_URL = ${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET = lightspeedpay-super-secret-key-32-chars-minimum-for-security
BULLMQ_PREFIX = lightspeed
RAZORPAY_KEY_ID = rzp_test_K5jcxeFtYgGmRb
RAZORPAY_KEY_SECRET = 81AVgu72Yqo452FvV6SLsT3k
```

---

## 🚀 **STEP 5: Deploy & Test**

### **After Adding Variables:**

1. Railway automatically re-deploy करेगा
2. Build logs check करें for success
3. Test health endpoint: `https://YOUR_PROJECT.up.railway.app/api/health`

### **Success Indicators:**

```bash
✅ Build completed successfully  
✅ Server listening on port 3000
✅ Health check passed
✅ Supabase connected
✅ Redis connected
```

---

## 🔍 **Debug Commands**

### **If Still Failing:**

```bash
# Check logs
railway logs

# Test specific endpoints
curl https://YOUR_PROJECT.up.railway.app/api/health
curl https://YOUR_PROJECT.up.railway.app/api/v1/admin/gateways
```

---

## 📞 **Quick Fix Commands**

### **Set All Variables at Once (Railway CLI):**

```bash
railway variable set SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
railway variable set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3ODkzNCwiZXhwIjoyMDY0OTU0OTM0fQ.70v06Ypqm8iMPOXiBjQiBET40kgw2rvMT18OFr7_xlE
railway variable set NEXT_PUBLIC_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
railway variable set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk
railway variable set REDIS_URL='${{Redis.REDIS_URL}}'
railway variable set ENCRYPTION_KEY=f37e01ce219e79c7cc4b319ee5aebc3e5a93ccc7573cb195c4b4ed658d339ecc
railway variable set NEXTAUTH_URL='${{RAILWAY_PUBLIC_DOMAIN}}'
railway variable set NEXTAUTH_SECRET=lightspeedpay-super-secret-key-32-chars-minimum-for-security
railway variable set BULLMQ_PREFIX=lightspeed
```

---

**🎯 मुख्य समस्या**: Documentation में "credentials included" लिखा था लेकिन वे actually placeholders थे। अब सभी proper values set करने के बाद deployment successful होगी! 