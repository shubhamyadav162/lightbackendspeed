# LightSpeedPay - Environment Setup Guide

This document outlines the required environment variables for deploying LightSpeedPay to different environments.

## Core Environment Variables

### Database Configuration
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
```

### Authentication
```
JWT_SECRET=[RANDOM_STRING_32_CHARS]
AUTH_COOKIE_DOMAIN=[YOUR_DOMAIN]
NEXTAUTH_URL=https://[YOUR_DOMAIN]
NEXTAUTH_SECRET=[RANDOM_STRING_32_CHARS]
```

### Payment Gateways
```
# Razorpay
RAZORPAY_KEY_ID=[YOUR_RAZORPAY_KEY_ID]
RAZORPAY_KEY_SECRET=[YOUR_RAZORPAY_KEY_SECRET]
RAZORPAY_WEBHOOK_SECRET=[YOUR_RAZORPAY_WEBHOOK_SECRET]

# PhonePe
PHONEPE_MERCHANT_ID=[YOUR_PHONEPE_MERCHANT_ID]
PHONEPE_SALT_KEY=[YOUR_PHONEPE_SALT_KEY]
PHONEPE_SALT_INDEX=[YOUR_PHONEPE_SALT_INDEX]
PHONEPE_HOST=https://api.phonepe.com/apis/hermes
```

### Background Jobs
```
REDIS_URL=redis://[USERNAME]:[PASSWORD]@[HOST]:[PORT]
JOB_CONCURRENCY=5
```

### Logging & Monitoring
```
LOG_LEVEL=info
SENTRY_DSN=[YOUR_SENTRY_DSN]
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://api.[YOUR_DOMAIN]
NEXT_PUBLIC_CHECKOUT_URL=https://checkout.[YOUR_DOMAIN]
```

## Environment-Specific Configuration

### Development
- Create a `.env.local` file in the root directory of both frontend and backend projects
- Use sandbox credentials for payment gateways
- Set `LOG_LEVEL=debug` for detailed logging

### Staging
- Configure GitHub Secrets for CI/CD pipeline
- Use test credentials for payment gateways
- Set up subdomain: `staging.[YOUR_DOMAIN]`
- Enable monitoring but disable real alerts

### Production
- Use separate production database with high availability
- Use production credentials for payment gateways
- Enable comprehensive logging and monitoring
- Configure auto-scaling for background job workers

## Setup Instructions

### Local Development
1. Copy the environment variables template to `.env.local`
2. Fill in the required values
3. Run the application with `npm run dev`

### CI/CD Setup (GitHub Actions)
1. Add all required environment variables as GitHub Secrets
2. Reference these secrets in the workflow files
3. Set environment-specific variables in deployment jobs

### Vercel Deployment
1. Configure environment variables in the Vercel project settings
2. Set up preview environments for pull requests
3. Configure production branch deployment

### Railway Deployment (Background Jobs)
1. Add environment variables in Railway project settings
2. Configure auto-scaling based on queue size
3. Set up health checks for worker instances

## Security Considerations
- Never commit environment files to version control
- Rotate secrets regularly
- Use different credentials for each environment
- Restrict environment variable access to necessary services only 