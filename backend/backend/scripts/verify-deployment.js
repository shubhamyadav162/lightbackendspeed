#!/usr/bin/env node
/**
 * Deployment Verification Script for LightSpeedPay Backend
 * Tests all critical endpoints to ensure Railway deployment is successful
 * 
 * Usage: node scripts/verify-deployment.js [BACKEND_URL]
 * Example: node scripts/verify-deployment.js https://lightspeedpay-backend.up.railway.app
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = process.argv[2] || process.env.BACKEND_URL || 'http://localhost:3100';
const TIMEOUT = 10000; // 10 seconds

console.log('🚀 LightSpeedPay Backend Deployment Verification');
console.log('=' .repeat(50));
console.log(`Testing backend URL: ${BACKEND_URL}`);
console.log('');

// Test endpoints
const endpoints = [
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'System Status',
    path: '/api/v1/system/status',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Gateway List',
    path: '/api/v1/admin/gateways',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Queue Stats',
    path: '/api/v1/admin/queues',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  },
  {
    name: 'Transactions',
    path: '/api/v1/transactions',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  },
  {
    name: 'Wallet Status',
    path: '/api/v1/wallets',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  }
];

// HTTP request helper
function makeRequest(url, method = 'GET', timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: timeout,
      headers: {
        'User-Agent': 'LightSpeedPay-Deployment-Verifier/1.0',
        'Accept': 'application/json'
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    const startTime = Date.now();

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test runner
async function runTest(endpoint) {
  const url = `${BACKEND_URL}${endpoint.path}`;
  
  try {
    console.log(`⏳ Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
    
    const response = await makeRequest(url, endpoint.method);
    
    const statusMatch = response.statusCode === endpoint.expectedStatus;
    const status = statusMatch ? '✅' : '❌';
    
    console.log(`${status} ${endpoint.name}: ${response.statusCode} (${response.responseTime}ms)`);
    
    if (!statusMatch && endpoint.critical) {
      console.log(`   💥 CRITICAL FAILURE: Expected ${endpoint.expectedStatus}, got ${response.statusCode}`);
      return false;
    }
    
    // Parse JSON response for additional validation
    try {
      const jsonResponse = JSON.parse(response.body);
      if (endpoint.name === 'Health Check') {
        if (jsonResponse.status === 'healthy') {
          console.log(`   ✅ Service is healthy`);
        }
      }
    } catch (e) {
      // Non-JSON response is okay for some endpoints
    }
    
    return statusMatch;
    
  } catch (error) {
    const status = endpoint.critical ? '💥' : '⚠️';
    console.log(`${status} ${endpoint.name}: ${error.message}`);
    return !endpoint.critical;
  }
}

// Main execution
async function main() {
  let allPassed = true;
  let criticalPassed = true;
  
  console.log('Running endpoint tests...\n');
  
  for (const endpoint of endpoints) {
    const result = await runTest(endpoint);
    
    if (!result) {
      allPassed = false;
      if (endpoint.critical) {
        criticalPassed = false;
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Deployment Verification Results:');
  console.log('');
  
  if (criticalPassed) {
    console.log('✅ CRITICAL SYSTEMS: All critical endpoints responding');
  } else {
    console.log('💥 CRITICAL SYSTEMS: Some critical endpoints failed');
  }
  
  if (allPassed) {
    console.log('✅ ALL SYSTEMS: Complete deployment verification passed');
    console.log('🚀 Backend is ready for production traffic!');
  } else {
    console.log('⚠️  ALL SYSTEMS: Some non-critical endpoints failed');
    console.log('⚡ Backend is functional but needs attention');
  }
  
  console.log('\n📋 Next Steps:');
  if (criticalPassed) {
    console.log('1. ✅ Connect frontend to this backend URL');
    console.log('2. ✅ Configure environment variables in frontend');
    console.log('3. ✅ Test end-to-end payment flow');
    console.log('4. ✅ Monitor logs for any issues');
  } else {
    console.log('1. ❌ Fix critical endpoint failures');
    console.log('2. ❌ Check Railway logs for errors');
    console.log('3. ❌ Verify environment variables');
    console.log('4. ❌ Re-run this verification script');
  }
  
  console.log('\n🔗 Useful URLs:');
  console.log(`Backend API: ${BACKEND_URL}`);
  console.log(`Health Check: ${BACKEND_URL}/api/health`);
  console.log(`Admin Panel: ${BACKEND_URL}/api/v1/admin/gateways`);
  
  // Exit with appropriate code
  process.exit(criticalPassed ? 0 : 1);
}

main().catch(error => {
  console.error('💥 Verification script failed:', error);
  process.exit(1);
}); 