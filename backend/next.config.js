/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
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
            value: process.env.FRONTEND_URL || 'http://localhost:5173',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, X-Client-Key',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Caching headers
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_PORT: process.env.PORT || '3100'
  },

  // Output configuration for Railway
  output: 'standalone',

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['pg', 'ioredis', 'bullmq', 'jose']
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
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