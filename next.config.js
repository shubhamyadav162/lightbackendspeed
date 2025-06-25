/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ];
  },

  // CORS headers for production and development
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowedOrigins = isDevelopment 
      ? ['http://localhost:5173', 'http://localhost:3000']
      : [
          process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
          'https://lightspeedpay-dashboard.vercel.app'
        ];

    return [
      {
        source: '/api/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: isDevelopment ? '*' : allowedOrigins.join(',')
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-api-key, x-client-key, x-client-salt' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' }
        ]
      }
    ];
  },

  // Environment variables
  env: {
    CUSTOM_PORT: process.env.PORT || '3100'
  },

  // Output configuration for Railway
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['pg', 'ioredis', 'bullmq', 'jose']
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Railway-specific optimizations
  poweredByHeader: false,
  compress: true,
  
  // API routes configuration
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '2mb',
  }
};

module.exports = nextConfig; 