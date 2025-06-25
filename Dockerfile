# Use Node.js 20 Alpine
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json .npmrc ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Next.js application (this creates .next/standalone)
RUN npm run build

# Copy static files to standalone build
RUN cp -r public .next/standalone/ 2>/dev/null || true
RUN cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:3100/api/health || exit 1

# Start with npm start (which runs standalone server)
CMD ["npm", "start"] 