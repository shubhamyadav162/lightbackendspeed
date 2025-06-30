# LightSpeedPay Frontend

एक professional payment gateway management dashboard जो React, TypeScript, और Vite के साथ built है।

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm या bun package manager
- Backend server running on Railway या locally

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/lightspeedpay.git
cd lightspeedpay/frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.local.template .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## 🔧 Environment Configuration

### Required Environment Variables

Create `.env.local` file with following configuration:

```env
# Backend API Configuration
VITE_API_BASE_URL=https://web-production-0b337.up.railway.app/api/v1
VITE_BACKEND_URL=https://web-production-0b337.up.railway.app
VITE_API_KEY=admin_test_key

# Supabase Configuration (must match backend exactly)
VITE_SUPABASE_URL=https://trmqbpnnboyoneyfleux.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Feature Flags
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DEBUG_LOGS=true

# Performance Settings
VITE_REQUEST_TIMEOUT=15000
VITE_RETRY_ATTEMPTS=3
```

### Local Development Override

For local backend development, uncomment these lines in `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3100/api/v1
VITE_BACKEND_URL=http://localhost:3100
```

## 🔗 Backend Connection Testing

### Auto Connection Test
- Connection status is displayed in top-right corner
- Green = Connected, Red = Failed, Orange = Testing
- Click "Details" for troubleshooting information

### Manual Testing

#### Browser Console Test
```javascript
// Open browser console and run:
await fetch('/api/v1/system/status', {
  headers: { 'x-api-key': 'admin_test_key' }
}).then(r => r.json())
```

#### Command Line Test
```bash
# Test from frontend directory
npm run test:connection

# Or direct curl test
curl -H "x-api-key: admin_test_key" \
  https://web-production-0b337.up.railway.app/api/v1/system/status
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Network Error" or "ERR_NETWORK"
**Possible Causes:**
- Backend server not running on Railway
- CORS configuration issues
- API URL incorrect

**Solutions:**
```bash
# Check Railway deployment status
railway logs

# Test direct backend access
curl -I https://web-production-0b337.up.railway.app/health

# Verify environment variables
echo $VITE_API_BASE_URL
```

#### 2. "401 Unauthorized"
**Possible Causes:**
- API key mismatch
- Missing x-api-key header

**Solutions:**
- Verify API key in `.env.local` matches backend
- Check browser network tab for missing headers
- Ensure backend middleware allows x-api-key header

#### 3. "404 Not Found"
**Possible Causes:**
- API endpoint doesn't exist
- Wrong API version in URL

**Solutions:**
- Check backend routing configuration
- Verify API path: `/api/v1/system/status`
- Review Railway deployment logs for startup errors

#### 4. CORS Issues
**Symptoms:**
- Browser blocks requests
- "CORS policy" errors in console

**Solutions:**
```bash
# Check CORS headers in response
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: x-api-key" \
  -X OPTIONS --verbose \
  https://web-production-0b337.up.railway.app/api/v1/system/status
```

Look for `Access-Control-Allow-Origin: http://localhost:5173` in response.

#### 5. Backend Server Not Starting (Railway)
**Error:** `"next start" does not work with "output: standalone"`

**Solution:** Backend needs to use correct startup command:
```json
{
  "scripts": {
    "start": "node .next/standalone/server.js"
  }
}
```

### Environment Variable Debugging

```bash
# Check all environment variables
npm run dev -- --debug

# Verify Vite variables
node -e "console.log(Object.keys(process.env).filter(k => k.startsWith('VITE_')))"
```

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run dev:debug        # Start with debug logging

# Building
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build

# Testing & Analysis
npm run test:connection  # Test backend connection
npm run lint             # ESLint code checking
npm run analyze          # Bundle size analysis

# Quality Assurance
npm run type-check       # TypeScript checking
```

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── ui/           # Shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Route components
│   ├── services/         # API services
│   ├── scripts/          # Utility scripts
│   └── types/            # TypeScript definitions
├── public/               # Static assets
└── tests/                # Test files
```

## 🔌 API Integration

### Service Layer
All API calls go through `src/services/api.ts`:

```typescript
import { apiService } from '@/services/api';

// Gateway Management
const gateways = await apiService.getGateways();
await apiService.createGateway(gatewayData);
await apiService.updateGateway(id, updates);

// System Monitoring
const status = await apiService.getSystemStatus();
const queueStats = await apiService.getQueueStats();
```

### Real-time Updates (SSE)
```typescript
import { subscribeToTransactionStream } from '@/services/api';

// Subscribe to live transaction updates
const unsubscribe = subscribeToTransactionStream((transaction) => {
  console.log('New transaction:', transaction);
});

// Cleanup
unsubscribe();
```

### React Query Integration
```typescript
import { useGateways } from '@/hooks/useApi';

function GatewayManagement() {
  const { data: gateways, isLoading, error } = useGateways();
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <GatewayList gateways={gateways} />;
}
```

## 🎨 UI Components

### Shadcn/ui Integration
Components are located in `src/components/ui/` and can be used throughout the app:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
```

### Dashboard Components
Specialized components in `src/components/dashboard/`:

- `GatewayManagement` - Payment gateway configuration
- `RealTimeMonitoring` - Live transaction monitoring
- `SystemStatus` - System health dashboard
- `AlertCenter` - Notification management

## 🔐 Security Features

- **CORS Protection** - Configured for Railway and localhost
- **API Key Authentication** - Required for all backend requests
- **Rate Limiting** - Implemented in backend middleware
- **Input Validation** - Zod schemas for form validation
- **Error Boundaries** - Graceful error handling

## 🚀 Deployment

### Vercel Deployment
```bash
# Build and deploy
npm run build
vercel --prod

# Environment variables
vercel env add VITE_API_BASE_URL
vercel env add VITE_SUPABASE_URL
# ... add all other VITE_ variables
```

### Railway Frontend Deployment
```bash
# If deploying frontend to Railway
railway login
railway link
railway up
```

## 📈 Performance Optimization

### Bundle Analysis
```bash
npm run analyze
# Opens bundle-report.html showing chunk sizes
```

### Code Splitting
- Route-based splitting with React.lazy()
- Component-based splitting for large features
- Dynamic imports for heavy libraries

### Caching Strategy
- React Query for API response caching
- Service Worker for static asset caching
- ETags for browser caching

## 🧪 Testing Strategy

### Unit Testing
```bash
npm run test
npm run test:coverage
```

### E2E Testing
```bash
npm run test:e2e
npm run test:e2e:ui
```

### Performance Testing
```bash
npm run lighthouse
npm run perf:audit
```

## 🤝 Development Workflow

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new dashboard component"
git push origin feature/new-feature

# Create pull request
# After review and approval, merge to main
```

### Code Quality
- ESLint + Prettier for code formatting
- Husky pre-commit hooks
- TypeScript strict mode
- Component prop validation

## 📞 Support

### Getting Help
1. Check this README first
2. Test backend connection: `npm run test:connection`
3. Check browser console for errors
4. Review Railway deployment logs
5. Create issue with connection test results

### Debug Information Collection
```bash
# Collect debug info
npm run test:connection > debug.log 2>&1
# Share debug.log when reporting issues
```

---

## 🔄 Version History

- **v1.0.0** - Initial release with basic dashboard
- **v1.1.0** - Added real-time monitoring
- **v1.2.0** - Enhanced error handling and connection testing
- **v1.3.0** - Production-ready deployment configuration

---

Built with ❤️ by LightSpeedPay Team
