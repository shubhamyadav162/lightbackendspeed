# Use Node.js 20 Alpine
FROM node:20-alpine

# FORCE-REBUILD: 2025-07-09-13:45:00
# ⚡ OPTIMIZED RAILWAY DEPLOYMENT: 2025-01-25-16:00:00 ⚡
# FASTER STARTUP + PROPER HEALTHCHECK TIMING
# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json .npmrc ./

# Install dependencies
# Using npm install instead of npm ci for better compatibility
RUN npm install --legacy-peer-deps

# Copy only necessary files for the build, excluding the nested frontend
COPY src ./src
COPY public ./public
COPY app ./app
COPY middleware.ts ./middleware.ts
COPY next.config.mjs ./next.config.mjs
COPY tsconfig.json ./tsconfig.json
COPY next-env.d.ts ./next-env.d.ts

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