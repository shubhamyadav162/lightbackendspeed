# Deployment Guide for LightSpeedPay Integrated

This document outlines the deployment process for the LightSpeedPay Integrated payment gateway system.

## Architecture Overview

LightSpeedPay Integrated consists of several components:

1. **Next.js Application** - Frontend and API routes
2. **Supabase Database** - PostgreSQL database
3. **Background Workers** - Node.js workers for transaction monitoring and settlements
4. **Redis** - For job queues and caching

## Deployment Options

### Option 1: Railway Deployment (Recommended)

[Railway](https://railway.app) provides a simple, integrated platform for deploying all components of this application.

#### Step 1: Create a Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize a new project
railway init
```

#### Step 2: Add Services to Railway

1. **Next.js Application**:
   ```bash
   railway up
   ```

2. **PostgreSQL Database**:
   - Add a PostgreSQL service from the Railway dashboard
   - The connection string will be automatically added as an environment variable

3. **Redis**:
   - Add a Redis service from the Railway dashboard
   - The connection string will be automatically added as an environment variable

#### Step 3: Configure Environment Variables

Add the following environment variables in the Railway dashboard:

```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
SUPABASE_ANON_KEY=your-supabase-anon-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
# ... and other environment variables
```

#### Step 4: Deploy Application

```bash
railway up
```

### Option 2: Vercel + Supabase Deployment

#### Step 1: Deploy Database to Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run migrations to set up the database schema:
   ```bash
   npx supabase db push
   ```

#### Step 2: Deploy Next.js to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy the application

#### Step 3: Deploy Background Workers

Background workers need to be deployed separately as they run continuously.

Options:
- Deploy as a separate service on Railway
- Use a serverless platform like AWS Lambda with scheduled triggers
- Use a dedicated VM or container on a cloud provider

## Database Migrations

Database migrations are handled through Supabase CLI.

```bash
# Apply migrations
npm run migrate:apply

# Create a new migration
npm run migrate:new name_of_migration
```

## Monitoring and Logging

### Monitoring Services

- Set up [Sentry](https://sentry.io) for error tracking
- Use [Datadog](https://www.datadoghq.com/) or [New Relic](https://newrelic.com/) for performance monitoring
- Configure alerts for critical errors and performance issues

### Logging

- Configure logging to a centralized service like [Logtail](https://betterstack.com/logtail) or [Papertrail](https://www.papertrail.com/)
- Set up log retention policies
- Monitor transaction failures and system errors

## Scaling Considerations

### Horizontal Scaling

- The Next.js application can be scaled horizontally by adding more instances
- Background workers should be deployed with shared Redis to prevent duplicate job processing
- Use connection pooling for database connections

### Database Scaling

- Consider read replicas for heavy read workloads
- Implement caching for frequently accessed data
- Use database connection pooling

## Security Considerations

1. **API Security**:
   - Use rate limiting on all API endpoints
   - Implement proper authentication and authorization
   - Validate all inputs with Zod schemas

2. **Database Security**:
   - Use Row Level Security (RLS) policies in Supabase
   - Encrypt sensitive data before storage
   - Regularly audit database access

3. **Payment Security**:
   - Never log sensitive payment information
   - Use proper encryption for API keys and credentials
   - Implement IP whitelisting for critical operations

## Backup and Disaster Recovery

1. **Database Backups**:
   - Configure automated daily backups
   - Test restoration process regularly
   - Store backups in multiple geographic locations

2. **Application Recovery**:
   - Document deployment procedures
   - Maintain configuration in version control
   - Practice recovery scenarios

## Going Live Checklist

Before going live, ensure:

1. All environment variables are properly configured
2. Database migrations have been applied
3. Payment gateway integrations are tested
4. SSL/TLS certificates are valid
5. Domain DNS is properly configured
6. Monitoring and alerting systems are active
7. Backup systems are in place
8. Security audit has been performed
9. Load testing has been conducted
10. Documentation is up-to-date

## Troubleshooting

Common issues and their solutions:

1. **Worker not processing jobs**:
   - Verify Redis connection
   - Check worker logs for errors
   - Ensure proper queue configuration

2. **Database connection issues**:
   - Check connection string
   - Verify network access
   - Check database server status

3. **Payment gateway failures**:
   - Verify API credentials
   - Check network connectivity
   - Ensure correct request format

## Support

For deployment assistance, contact the development team at dev@lightspeedpay.com. 