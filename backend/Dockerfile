# Use Node.js 20 Alpine
FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files and install ALL dependencies (including dev for build)
COPY package.json package-lock.json .npmrc ./
RUN npm ci --legacy-peer-deps

# Copy all source code
COPY . .

# Build the Next.js application
RUN npm run build

# Copy static files for standalone build
RUN cp -r public .next/standalone/public 2>/dev/null || true
RUN cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

# Create smart startup script for Next.js standalone
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting LightSpeedPay Backend..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Set default port if not provided' >> /app/start.sh && \
    echo 'export PORT=${PORT:-3100}' >> /app/start.sh && \
    echo 'export NODE_ENV=production' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Load production environment if available' >> /app/start.sh && \
    echo 'if [ -f /app/.env.production ]; then' >> /app/start.sh && \
    echo '  echo "📋 Loading production environment variables..."' >> /app/start.sh && \
    echo '  export $(cat /app/.env.production | grep -v "^#" | grep -v "^$" | xargs)' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "🌟 Starting Next.js standalone server on port $PORT..."' >> /app/start.sh && \
    echo 'cd /app/.next/standalone' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Create non-root user and change ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3100
ENV PORT=3100

# Health check with longer timeout for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:3100/api/health || exit 1

# Start with the smart script
CMD ["/app/start.sh"] 