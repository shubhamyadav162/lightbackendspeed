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

  // Exclude Supabase Edge Functions from Next.js build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('supabase/functions/**/*');
    }
    return config;
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Railway-specific optimizations
  poweredByHeader: false,
  compress: true
};

module.exports = nextConfig; 