const fetch = require('node-fetch');

async function testPayAPI() {
    console.log('🚀 Testing Direct Pay API...');
    
    try {
        const response = await fetch('https://web-production-0b337.up.railway.app/api/v1/pay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'FQABLVIEYC',      // Working Client Key
                'x-api-secret': 'QECGU7UHNT',    // Working Client Salt
            },
            body: JSON.stringify({
                amount: 10,
                customer_email: 'test@ngme.in',
                customer_name: 'NGME Test User',
                customer_phone: '9999999999',
                payment_method: 'upi',
                test_mode: true
            })
        });
        
        const data = await response.json();
        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('❌ API Test Error:', error.message);
    }
}

testPayAPI(); 