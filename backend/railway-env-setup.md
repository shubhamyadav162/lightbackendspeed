# Railway Environment Variables Setup

## Critical Variables (REQUIRED)
```bash
# Supabase Configuration
SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMxMzE1NywiZXhwIjoyMDY0ODg5MTU3fQ.Q5ehFwWXZZghGwsjYW55KDtRKmYXtLhXRlnNw6Jlz0Y
NEXT_PUBLIC_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk

# Redis (Railway auto-provides when you add Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# Encryption Key (32-byte hex string)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# App Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BACKEND_URL=https://lightspeedpay-backend-production.up.railway.app

# BullMQ Configuration
BULLMQ_PREFIX=lightspeed
MAX_CONCURRENCY_TRANSACTION=25
MAX_CONCURRENCY_WEBHOOK=50
MAX_CONCURRENCY_WHATSAPP=30

# Payment Gateway (Test Keys)
RAZORPAY_KEY_ID=rzp_test_K5jcxeFtYgGmRb
RAZORPAY_KEY_SECRET=81AVgu72Yqo452FvV6SLsT3k
```

## Optional Variables (for full functionality)
```bash
# WhatsApp Integration
WA_API_URL=https://your-whatsapp-provider.com/api
WA_API_KEY=your_whatsapp_api_key
WA_TEMPLATE_LOW_BALANCE=low_balance_template
WA_TEMPLATE_TXN_UPDATE=transaction_update_template

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Webhook Verification
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
PAYU_SALT=your_payu_salt
``` 