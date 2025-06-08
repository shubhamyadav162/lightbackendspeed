# LightSpeedPay - Deployment Guide

This guide provides detailed instructions for deploying the LightSpeedPay platform to production environments.

## Prerequisites

Before beginning the deployment process, ensure you have:

1. Access to the GitHub repository
2. Admin access to Vercel account
3. Admin access to Railway account
4. Admin access to Supabase account
5. All required API keys and credentials for payment gateways
6. Domain names configured and ready

## Step 1: Setting Up GitHub Repository

1. Push the codebase to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/lightspeedpay.git
   git push -u origin main
   ```

2. Configure GitHub repository secrets for CI/CD:
   - Go to Repository Settings > Secrets and Variables > Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your Vercel API token
     - `RAILWAY_TOKEN`: Your Railway API token
     - `RAILWAY_SERVICE_ID`: Your Railway service ID
     - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
     - `SUPABASE_PROJECT_REF_PREVIEW`: Supabase project reference for preview environment
     - `SUPABASE_PROJECT_REF_PROD`: Supabase project reference for production environment

## Step 2: Setting Up Supabase Database

1. Create a new Supabase project:
   - Go to https://app.supabase.io/
   - Click "New Project"
   - Enter project details
   - Choose a region close to your target users
   - Wait for the project to initialize

2. Get your Supabase credentials:
   - Project URL: `https://[PROJECT_ID].supabase.co`
   - API Keys: Found in Project Settings > API
   - Save the `anon` public key and `service_role` key

3. Run migrations manually the first time:
   ```bash
   cd supabase-mcp
   npm install -g supabase
   supabase login --access-token your-access-token
   supabase link --project-ref your-project-ref
   supabase db push
   ```

4. Verify database schema:
   - Check that all tables have been created
   - Verify relationships and constraints
   - Run basic queries to ensure proper setup

## Step 3: Setting Up Vercel (Frontend)

1. Create a new Vercel project:
   - Go to https://vercel.com/
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings

2. Configure environment variables:
   - Go to Project Settings > Environment Variables
   - Add all required environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://api.lightspeedpay.com
     NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
     NEXTAUTH_SECRET=[STRONG_RANDOM_SECRET]
     NEXTAUTH_URL=https://lightspeedpay.com
     ```

3. Configure custom domains:
   - Go to Project Settings > Domains
   - Add your domains:
     - `lightspeedpay.com`
     - `www.lightspeedpay.com`
     - `checkout.lightspeedpay.com`
   - Follow Vercel's instructions for DNS configuration

4. Configure preview deployments:
   - Go to Project Settings > Git
   - Enable preview deployments for pull requests

## Step 4: Setting Up Railway (Background Jobs)

1. Create a new Railway project:
   - Go to https://railway.app/
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your GitHub repository

2. Configure environment variables:
   - Go to Project Settings > Variables
   - Add all required environment variables:
     ```
     DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
     SUPABASE_URL=https://[PROJECT_ID].supabase.co
     SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
     JWT_SECRET=[STRONG_SECRET]
     REDIS_URL=redis://[USERNAME]:[PASSWORD]@[HOST]:[PORT]
     NODE_ENV=production
     ```

3. Configure project settings:
   - Go to Project Settings > General
   - Set the root directory to `supabase-mcp`
   - Set the start command to `npm run start:worker`

4. Set up auto-scaling:
   - Go to Project Settings > Scaling
   - Configure minimum and maximum instances
   - Set up auto-scaling rules based on CPU and memory usage

## Step 5: Configuring Payment Gateways

### Razorpay

1. Log in to your Razorpay dashboard
2. Go to Settings > API Keys
3. Generate live API keys
4. Configure webhook URL: `https://api.lightspeedpay.com/webhooks/razorpay`
5. Enable the required webhooks:
   - Payment authorized
   - Payment captured
   - Payment failed

### PhonePe

1. Log in to your PhonePe dashboard
2. Go to Developer Settings
3. Generate production API keys
4. Configure callback URL: `https://api.lightspeedpay.com/webhooks/phonepe`
5. Set up IP allowlisting if required

## Step 6: Final Verification and Launch

Follow this sequence for a smooth launch:

1. **Soft Launch**:
   - Invite 5-10 partner merchants
   - Process limited transaction volume
   - Monitor system performance closely
   - Address any issues immediately

2. **Full Launch**:
   - Remove access restrictions
   - Send announcement to all pre-registered merchants
   - Begin onboarding new merchants
   - Scale infrastructure according to demand

3. **Post-Launch Monitoring**:
   - Monitor transaction success rates
   - Track API response times
   - Watch for error patterns
   - Adjust resources as needed

## Rollback Plan

In case of critical issues during launch:

1. **Identification Criteria**:
   - Transaction success rate drops below 99.5%
   - API response time exceeds 1 second for more than 5 minutes
   - Error rate exceeds 1% for more than 5 minutes
   - Security vulnerability identified

2. **Rollback Process**:
   - Halt new merchant onboarding
   - Notify operations team via emergency channel
   - Convene incident response team
   - Execute relevant rollback procedure:
     - Code rollback to previous stable version
     - Database rollback if data corruption occurred
     - Infrastructure configuration rollback
   - Notify affected merchants via multiple channels
   - Update status page with incident details
