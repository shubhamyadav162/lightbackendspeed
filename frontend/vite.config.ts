import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from "tailwindcss";
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analysis - only in analyze mode
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/bundle-report.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // sunburst, treemap, network
    })] : []),
    // Enhanced chunk splitting - temporarily disabled
    // chunkSplitPlugin({
    //   strategy: 'default',
    //   customSplitting: {
    //     'react-vendor': ['react', 'react-dom'],
    //     'router-vendor': ['react-router-dom'],
    //     'query-vendor': ['@tanstack/react-query'],
    //     'ui-vendor': ['lucide-react', '@radix-ui'],
    //     'chart-vendor': ['recharts'],
    //     'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
    //     'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
    //     'utils': ['axios', '@supabase/supabase-js', 'date-fns', 'clsx', 'tailwind-merge']
    //   }
    // }),
    // Gzip and Brotli compression - temporarily disabled
    // viteCompression({
    //   algorithm: 'gzip',
    //   ext: '.gz',
    // }),
    // viteCompression({
    //   algorithm: 'brotliCompress',
    //   ext: '.br',
    // }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
    devSourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
    cors: {
      origin: [
        'http://localhost:3000', 
        'http://localhost:3100',
        'http://localhost:5173',
        'https://web-production-0b337.up.railway.app'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Client-Key', 
        'x-api-key', 
        'Accept', 
        'Origin',
        'X-Requested-With',
        'Cache-Control',
        'Access-Control-Allow-Origin'
      ],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'https://web-production-0b337.up.railway.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔥 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 Proxying request:', req.method, req.url);
            // Ensure API key is present
            if (!proxyReq.hasHeader('x-api-key')) {
              proxyReq.setHeader('x-api-key', process.env.VITE_API_KEY || 'admin_test_key');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: process.env.NODE_ENV === 'development',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'react-core': ['react', 'react-dom'],
          // Routing
          'router': ['react-router-dom'],
          // State management and queries  
          'query': ['@tanstack/react-query'],
          // UI components and icons
          'ui-base': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'ui-forms': ['@radix-ui/react-checkbox', '@radix-ui/react-select', '@radix-ui/react-switch'],
          'icons': ['lucide-react'],
          // Charts and visualization
          'charts': ['recharts'],
          // Drag and drop
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Forms and validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // HTTP and data utils
          'http-utils': ['axios', '@supabase/supabase-js'],
          // Utility libraries
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // Toast notifications
          'notifications': ['sonner']
        },
        // Optimize chunk file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      }
    },
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096, // 4kb
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      '@supabase/supabase-js',
      'lucide-react',
      'recharts',
      'sonner'
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    cors: true,
  },
});
