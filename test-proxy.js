const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8081;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-api-secret', 'Origin', 'Accept']
}));

// Proxy to Railway backend
app.use('/api', createProxyMiddleware({
  target: 'https://web-production-0b337.up.railway.app',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔗 Proxying: ${req.method} ${req.url}`);
    console.log(`📋 Headers:`, req.headers);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Proxy Error', message: err.message });
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'lightspeedpay-proxy',
    target: 'https://web-production-0b337.up.railway.app',
    port: PORT 
  });
});

app.listen(PORT, () => {
  console.log('🚀 LightSpeedPay CORS Proxy Server');
  console.log(`📡 Proxy Server: http://localhost:${PORT}`);
  console.log(`🔗 Target Backend: https://web-production-0b337.up.railway.app`);
  console.log(`✅ CORS enabled for all origins`);
  console.log(`💡 Update frontend to use: http://localhost:${PORT}/api/v1`);
  console.log(`Press Ctrl+C to stop\n`);
}); 