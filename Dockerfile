# Use Node.js 20 Alpine
FROM node:20-alpine

# FORCE-REBUILD: 2025-07-09-14:30:00
# ⚡ SIMPLIFIED & ROBUST BUILD CONTEXT ⚡
# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files first (for better caching)
COPY backend/package.json backend/package-lock.json backend/.npmrc* ./
# In case .npmrc is not present, the wildcard will prevent build failure

# Install dependencies
# Using npm install instead of npm ci for better compatibility
RUN npm install --legacy-peer-deps

# Copy the entire backend directory content into the container.
# This is a robust way to ensure all necessary files for the build are present,
# including any hidden or configuration files that might have been missed before.
COPY backend/ .

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
# Increased start-period to allow Next.js to fully initialize
HEALTHCHECK --interval=20s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -f http://localhost:3100/health || exit 1

# 🚀 EXPRESS SERVER COMMAND: Direct Express server startup
CMD ["node", "server-express.js"] 