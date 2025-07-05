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

  // Webpack configuration to handle Redis during build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve Redis on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ioredis: false,
      };
    }
    return config;
  },

  // Railway-specific optimizations
  poweredByHeader: false,
  compress: true
};

module.exports = nextConfig; 