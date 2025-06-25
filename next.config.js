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

  // CORS headers for development
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-api-key' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' }
        ]
      }
    ];
  },

  // Environment variables
  env: {
    CUSTOM_PORT: process.env.PORT || '3100'
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['pg', 'ioredis', 'bullmq']
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  }
};

module.exports = nextConfig; 