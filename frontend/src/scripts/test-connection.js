#!/usr/bin/env node

/**
 * LightSpeedPay Frontend-Backend Connection Test
 * 
 * This script tests the connection between frontend and backend
 * Run with: node src/scripts/test-connection.js
 */

import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://web-production-0b337.up.railway.app/api/v1';
const API_KEY = process.env.VITE_API_KEY || 'admin_test_key';

async function testConnection() {
  console.log('🔗 LightSpeedPay Backend Connection Test');
  console.log('=====================================');
  console.log(`📍 Testing URL: ${API_BASE_URL}/system/status`);
  console.log(`🔑 API Key: ${API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

  try {
    const startTime = Date.now();
    
    const response = await axios.get(`${API_BASE_URL}/system/status`, {
      timeout: 10000,
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'LightSpeedPay-Test/1.0'
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ SUCCESS - Backend connection successful!');
    console.log('==========================================');
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`📦 Data Keys: ${Object.keys(response.data || {}).join(', ') || 'None'}`);
    console.log(`🌐 Content-Type: ${response.headers['content-type'] || 'Unknown'}`);
    
    if (response.data) {
      console.log('\n📄 Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.log('❌ FAILED - Backend connection failed!');
    console.log('====================================');
    console.log(`💥 Error: ${error.message}`);
    console.log(`🔢 Code: ${error.code || 'Unknown'}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`📦 Response Data: ${JSON.stringify(error.response.data || {})}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('   • Backend server may not be running');
      console.log('   • Check Railway deployment status');
      console.log('   • Verify URL is correct');
    } else if (error.response?.status === 401) {
      console.log('   • API key may be incorrect');
      console.log('   • Check environment variables');
    } else if (error.response?.status === 404) {
      console.log('   • API endpoint may not exist');
      console.log('   • Verify API version and path');
    } else if (error.code === 'ECONNABORTED') {
      console.log('   • Request timeout (10 seconds)');
      console.log('   • Backend may be slow to respond');
    }
    
    console.log('\n🌐 Test direct access:');
    console.log(`   curl -H "x-api-key: ${API_KEY}" ${API_BASE_URL}/system/status`);
    
    process.exit(1);
  }
}

// Run the test
testConnection().catch(error => {
  console.error('💥 Unexpected error:', error.message);
  process.exit(1);
}); 