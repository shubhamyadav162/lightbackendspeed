# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install dependencies and curl
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Copy npm config first
COPY .npmrc ./

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy all source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Set port
EXPOSE 3000
ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Create start script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Building Next.js application..."' >> /app/start.sh && \
    echo 'npm run build' >> /app/start.sh && \
    echo 'echo "Starting server..."' >> /app/start.sh && \
    echo 'npm run start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application (build and then run)
CMD ["/app/start.sh"] 