const express = require('express');
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3100;

console.log(`🚀 Starting LightSpeedPay Express Server`);
console.log(`📂 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Hostname: ${hostname}`);
console.log(`🔌 Port: ${port}`);

// Initialize Next.js app
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  
  // Health check endpoint - GUARANTEED to work
  app.get('/health', (req, res) => {
    console.log('✅ Health check requested');
    res.status(200).json({
      status: 'healthy',
      service: 'lightspeedpay-backend',
      timestamp: new Date().toISOString(),
      port: port,
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });

  app.head('/health', (req, res) => {
    console.log('✅ Health check HEAD requested');
    res.status(200).end();
  });

  // Handle all other requests with Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start the server
  const server = createServer(app);
  
  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Server startup error:', err);
      throw err;
    }
    console.log(`🎉 EXPRESS SERVER READY!`);
    console.log(`🌐 Listening on http://${hostname}:${port}`);
    console.log(`💚 Health endpoint: http://${hostname}:${port}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('🔚 Process terminated');
      process.exit(0);
    });
  });

}).catch((ex) => {
  console.error('❌ Next.js initialization error:', ex.stack);
  process.exit(1);
}); 