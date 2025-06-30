#!/usr/bin/env node

// Custom server startup for Railway deployment
// Ensures PORT environment variable is properly set

const { spawn } = require('child_process');
const path = require('path');

// Set port from environment or default to 3100
const port = process.env.PORT || '3100';
process.env.PORT = port;

console.log(`🚀 Starting LightSpeedPay Backend on port ${port}`);
console.log(`📂 Working directory: ${process.cwd()}`);
console.log(`🔧 Node version: ${process.version}`);

// Change to standalone directory and start server
process.chdir(path.join(__dirname, '.next', 'standalone'));

console.log(`📂 Changed to: ${process.cwd()}`);
console.log(`🎯 Starting server.js with PORT=${port}`);

// Start the Next.js server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port }
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🔄 Server exited with code ${code}`);
  process.exit(code);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  server.kill('SIGINT');
}); 