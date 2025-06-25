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

# Create startup script as root
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Building application with build-time env..."' >> /app/start.sh && \
    echo 'if [ -f .env.build ]; then' >> /app/start.sh && \
    echo '  export $(cat .env.build | grep -v "#" | xargs)' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'npm run build' >> /app/start.sh && \
    echo 'echo "Starting server with runtime env..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Create non-root user and change ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000
ENV PORT=3000

# Health check with longer timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start with the script
CMD ["/app/start.sh"] 