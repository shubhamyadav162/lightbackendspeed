# Use Node.js 20 Alpine
FROM node:20-alpine

# ⚡ OPTIMIZED RAILWAY DEPLOYMENT: 2025-01-25-16:00:00 ⚡
# FASTER STARTUP + PROPER HEALTHCHECK TIMING
# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json .npmrc ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Next.js application for Express server
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Set environment
ENV NODE_ENV=production
ENV PORT=3100

# Expose port
EXPOSE 3100

# Optimized health check - use /health endpoint for Express server
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3100/health || exit 1

# 🚀 EXPRESS SERVER COMMAND: Direct Express server startup
CMD ["node", "server-express.js"] 