# LightSpeedPay - Payment Gateway Wrapper

LightSpeedPay is a comprehensive payment gateway wrapper that provides unified API access to multiple payment gateways, includes a sandbox environment for testing, and supports gaming clients like Unity.

## Features

- Unified API for multiple payment gateways (Razorpay, PhonePe, etc.)
- Merchant onboarding and management
- Transaction processing and monitoring
- Real-time analytics dashboard
- Webhook notification system
- Multi-currency support
- Unity SDK integration
- Sandbox environment for testing

## Tech Stack

- **Frontend/API**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Authentication**: NextAuth.js with JWT
- **Background Jobs**: BullMQ on Railway
- **Hosting**: Vercel (frontend/API), Railway (workers)
- **Validation**: Zod for input validation
- **ORM**: Prisma with Supabase
- **Monitoring**: Supabase Realtime for live updates

## Project Structure

- `frontend/` - Next.js frontend and API routes
- `supabase-mcp/` - Supabase migrations and backend services
- `unity-sdk/` - Unity SDK for game integration
- `memory-bank/` - Project documentation and architecture

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Supabase account
- Vercel account
- Railway account

### Local Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/lightspeedpay.git
   cd lightspeedpay
   ```

2. Frontend setup:
   ```
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

3. Supabase setup:
   ```
   cd supabase-mcp
   npm install
   cp .env.example .env
   npm run start
   ```

4. Run migrations:
   ```
   cd supabase-mcp
   npm run migration:run
   ```

### Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

#### Backend (.env)
```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
REDIS_URL=
```

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure the environment variables in Vercel
4. Deploy

### Railway (Backend Jobs)

1. Push your code to GitHub
2. Connect your GitHub repository to Railway
3. Configure the environment variables in Railway
4. Deploy

### Supabase (Database)

1. Create a new Supabase project
2. Run migrations using the Supabase CLI
   ```
   supabase link --project-ref your-project-ref
   supabase db push
   ```

## CI/CD Setup

The repository includes GitHub Action workflows for CI/CD:

- `.github/workflows/frontend-deployment.yml` - Deploys frontend to Vercel
- `.github/workflows/backend-deployment.yml` - Deploys backend to Railway
- `.github/workflows/supabase-migrations.yml` - Runs Supabase migrations

You need to configure the following secrets in your GitHub repository:

- `VERCEL_TOKEN` - Vercel API token
- `RAILWAY_TOKEN` - Railway API token
- `RAILWAY_SERVICE_ID` - Railway service ID
- `SUPABASE_ACCESS_TOKEN` - Supabase access token
- `SUPABASE_PROJECT_REF_PREVIEW` - Supabase project reference for preview environment
- `SUPABASE_PROJECT_REF_PROD` - Supabase project reference for production environment

## Documentation

For more detailed documentation, please refer to the `memory-bank/` directory, which contains comprehensive documentation on:

- API endpoints
- Database schema
- Integration guides
- Merchant onboarding
- Webhook system
- Monitoring system
- Deployment guides
- Security practices

## License

This project is proprietary and confidential. 