# LightSpeedPay - Technical Context

## Technologies Used

### Frontend
- **Next.js 14 (App Router)**: React framework for both frontend and API routes
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn/UI**: Component library built on Radix UI and Tailwind
- **React Hook Form**: For form validation and handling
- **Recharts**: For data visualization and analytics

### Backend & API
- **Next.js API Routes**: For REST API endpoints
- **Zod**: Schema validation library for request/response validation
- **JWT**: For authentication tokens
- **NextAuth.js**: Authentication solution for Next.js
- **Crypto-js**: For cryptographic operations (HMAC, AES)

### Database
- **Supabase PostgreSQL**: For data storage
- **Prisma ORM**: Type-safe database client
- **Supabase Realtime**: For real-time updates
- **pgBouncer**: Connection pooling for PostgreSQL

### Background Processing
- **BullMQ**: Redis-based queue for background jobs
- **Redis**: For queue management and caching
- **Bull Board**: UI for monitoring queue status

### Deployment & Infrastructure
- **Vercel**: For hosting Next.js application
- **Railway**: For hosting background workers
- **GitHub Actions**: For CI/CD pipeline
- **Supabase Edge Functions**: For serverless functions

### Testing & Monitoring
- **Jest**: For unit testing
- **Cypress**: For end-to-end testing
- **Sentry**: For error tracking and monitoring
- **Supabase Storage**: For log storage and retrieval

## Development Setup
- Node.js 18+ for local development
- Supabase CLI for local database development
- Prisma CLI for database migrations
- ESLint and Prettier for code quality
- Husky for pre-commit hooks

## Technical Constraints
1. **Supabase Free Tier Limitations**:
   - 500MB database storage
   - Limited number of Realtime connections
   - Edge functions execution limits

2. **Vercel Free Tier Limitations**:
   - Serverless function execution time
   - Bandwidth restrictions
   - Build minutes per month

3. **Railway Free Tier Limitations**:
   - Execution hours per month
   - Memory and CPU constraints
   - Redis storage limits

4. **Security Requirements**:
   - PCI-DSS compliance considerations
   - Sensitive data handling requirements
   - Authentication and authorization needs

## Dependencies
- **Core NPM Packages**:
  - next
  - react
  - typescript
  - prisma
  - @supabase/supabase-js
  - bullmq
  - zod
  - next-auth
  - tailwindcss
  - crypto-js

- **Development Dependencies**:
  - typescript
  - eslint
  - prettier
  - jest
  - @testing-library/react
  - cypress

- **Third-Party Services**:
  - Supabase (Database, Auth, Storage, Edge Functions)
  - Vercel (Hosting)
  - Railway (Background Jobs)
  - GitHub (Source Control, CI/CD)
  - Sentry (Error Tracking) 