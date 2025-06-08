# LightSpeedPay - Staging Environment Configuration

This document outlines the configuration and setup process for the LightSpeedPay staging environment.

## Overview

The staging environment is a pre-production environment that closely mirrors the production setup. It's used for testing new features, integrations, and updates before deploying to production.

## Infrastructure Setup

### Hosting

1. **Frontend (Next.js)**
   - Deploy to Vercel
   - Configure as `staging.lightspeedpay.com`
   - Enable preview deployments for pull requests

2. **API Services**
   - Deploy to Vercel
   - Configure as `api-staging.lightspeedpay.com`
   - Share project with frontend but use different build settings

3. **Background Jobs**
   - Deploy to Railway
   - Configure auto-scaling (min: 1, max: 3 instances)
   - Set up health checks

### Database

1. **Supabase Project**
   - Create a dedicated staging project
   - Run migrations from development to staging
   - Seed with test data
   - Enable point-in-time recovery
   - Schedule daily backups

## Environment Variables

Set the following environment variables in the respective deployment platforms:

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://api-staging.lightspeedpay.com
NEXT_PUBLIC_CHECKOUT_URL=https://checkout-staging.lightspeedpay.com
NEXT_PUBLIC_ENV=staging
```

### API (Vercel)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
SUPABASE_URL=https://[STAGING_PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[STAGING_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[STAGING_SERVICE_ROLE_KEY]
JWT_SECRET=[STAGING_JWT_SECRET]
NODE_ENV=staging
```

### Background Jobs (Railway)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
REDIS_URL=redis://[USERNAME]:[PASSWORD]@[HOST]:[PORT]
JOB_CONCURRENCY=3
LOG_LEVEL=debug
NODE_ENV=staging
```

## Payment Gateway Configuration

1. **Razorpay**
   - Use test account credentials
   - Configure webhook URL as `https://api-staging.lightspeedpay.com/webhooks/razorpay`
   - Enable all required webhooks in the Razorpay dashboard

2. **PhonePe**
   - Use sandbox credentials
   - Configure callback URL as `https://api-staging.lightspeedpay.com/webhooks/phonepe`
   - Add IP allowlist for staging servers

## Monitoring & Logging

1. **Application Logs**
   - Configure Supabase Edge Functions logging
   - Set up Vercel logs retention
   - Enable Railway logs export

2. **Performance Monitoring**
   - Enable Vercel Analytics
   - Configure Sentry for error tracking
   - Set up uptime monitoring with UptimeRobot

3. **Alerts**
   - Configure alerts for critical errors
   - Set up notification channels (email, Slack)
   - Create performance degradation alerts

## Testing in Staging

1. **Test Accounts**
   - Create dedicated test merchant accounts
   - Generate API keys for testing
   - Document test credentials in a secure location

2. **Test Data**
   - Seed the database with test merchants, transactions, and gateways
   - Create scripts for generating test data
   - Set up data cleanup routines

3. **Testing Procedures**
   - Run integration tests against staging
   - Perform manual checkout flow testing
   - Verify webhook processing
   - Test failover mechanisms

## Deployment Process

1. **CI/CD Pipeline**
   - Configure GitHub Actions for automated deployments
   - Set up staging deployment on merge to `staging` branch
   - Run tests before deployment

2. **Deployment Verification**
   - Run post-deployment tests
   - Verify database migrations
   - Check API endpoints
   - Validate frontend functionality

3. **Rollback Procedure**
   - Document rollback steps
   - Test rollback procedures
   - Configure automatic rollback on critical errors

## Security Considerations

1. **Access Control**
   - Restrict access to staging environment
   - Use different credentials than production
   - Implement IP restrictions for admin access

2. **Data Security**
   - Use test data only (no production data)
   - Encrypt sensitive test credentials
   - Regularly rotate staging secrets

3. **Compliance**
   - Ensure staging environment follows the same compliance rules as production
   - Document compliance checks

## Staging to Production Migration

1. **Validation Checklist**
   - Feature completeness verification
   - Performance testing results
   - Security scan results
   - User acceptance testing

2. **Migration Process**
   - Database migration validation
   - Configuration diff check
   - Environment variable verification
   - DNS and routing updates

This staging environment configuration ensures a reliable pre-production testing environment that closely mirrors the production setup while maintaining proper isolation and security. 