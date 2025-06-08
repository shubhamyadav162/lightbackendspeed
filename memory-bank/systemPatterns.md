# LightSpeedPay - System Patterns

## System Architecture
LightSpeedPay follows a modern microservices-inspired architecture with the following key components:

1. **API Layer**:
   - Next.js API routes for frontend-facing endpoints
   - Middleware for authentication, validation, and rate limiting
   - Supabase Edge Functions for specialized processing

2. **Database Layer**:
   - Supabase PostgreSQL for data persistence
   - Prisma ORM for type-safe database operations
   - Transaction-based operations for data integrity

3. **Background Processing**:
   - BullMQ workers for asynchronous jobs
   - Monitoring and health check services
   - Settlement processing and reconciliation

4. **Frontend Applications**:
   - Next.js for merchant and admin dashboards
   - React components with Tailwind CSS and Shadcn/UI
   - Client-side SDK for merchant integration

## Key Technical Decisions

### 1. Gateway Abstraction Layer
We're implementing a Gateway Abstraction Layer (GAL) that normalizes interactions with different payment gateways through a common interface. This allows us to:
- Add new gateways without changing core business logic
- Implement gateway-specific adapters for each provider
- Normalize responses and error handling

### 2. Transaction State Machine
Transactions follow a strict state machine pattern:
- PENDING → SUCCESS/FAILED/CANCELLED
- Immutable audit trail for all state transitions
- Automatic retry logic with exponential backoff

### 3. Real-time Monitoring
Implementing a comprehensive monitoring system:
- Gateway health checks at regular intervals
- Success rate and response time tracking
- Automatic failover based on predefined thresholds
- Alert generation for system anomalies

### 4. Security-First Approach
Security is implemented at multiple levels:
- HMAC signatures for API authentication
- JWT tokens with short expiry for session management
- AES-256 encryption for sensitive data
- Rate limiting and input validation

## Design Patterns

### 1. Repository Pattern
Used for database access, abstracting the details of data persistence and allowing for easier testing and potential database migrations.

### 2. Adapter Pattern
Implemented for payment gateway integrations, providing a consistent interface for different payment providers.

### 3. Strategy Pattern
Applied to gateway selection, allowing the system to dynamically choose the optimal gateway based on current conditions.

### 4. Observer Pattern
Used with Supabase Realtime for live updates and notifications across the system.

### 5. Circuit Breaker Pattern
Implemented for gateway health management, automatically disabling failing gateways and re-enabling them after recovery.

## Component Relationships

### Core API Flow
1. Authentication → Validation → Gateway Selection → Transaction Creation → Checkout Generation

### Background Jobs Flow
1. Transaction Monitor → Gateway Status Check → Alert Generation
2. Settlement Calculation → Merchant Wallet Update

### Dashboard Data Flow
1. Data Fetching → Real-time Updates → Analytics Processing → UI Rendering 