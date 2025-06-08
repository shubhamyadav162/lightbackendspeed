# LightSpeedPay - Project Brief

## Overview
LightSpeedPay is a unified payment gateway wrapper that provides merchants with a single API to integrate multiple payment gateways. The system ensures high reliability for real money transactions with exhaustive validation, retries, monitoring, alerts, and failover mechanisms to guarantee 99.9% uptime and data integrity.

## Core Requirements
- Unified API access to multiple payment gateways
- Sandbox environment for testing
- Support for web and gaming clients (Unity)
- Merchant onboarding and management
- Transaction processing with automatic retries and failover
- Real-time monitoring and alerts
- Administrative controls and dashboards
- 99.9% uptime guarantee

## Technology Stack
- Frontend/API: Next.js 14 (App Router) with TypeScript
- Database: Supabase PostgreSQL
- Styling: Tailwind CSS + Shadcn/UI components
- Authentication: NextAuth.js with JWT
- Background Jobs: BullMQ on Railway
- Hosting: Vercel (frontend/API), Railway (workers)
- Validation: Zod for input validation
- ORM: Prisma with Supabase
- Monitoring: Supabase Realtime for live updates

## Project Scope
1. Database schema setup in Supabase
2. Authentication system for merchants and admins
3. Core payment API endpoints
4. Checkout page for payment processing
5. Sandbox environment for testing
6. Background jobs for monitoring and maintenance
7. Merchant, Admin, and Super Admin dashboards
8. Client SDKs (Web and Unity)
9. Security implementations
10. Real-time monitoring and alerts

This project aims to provide a reliable, secure, and easy-to-use payment gateway wrapper for merchants, with a focus on reliability, security, and user experience. 