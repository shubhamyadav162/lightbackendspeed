#!/usr/bin/env node

/**
 * 🚀 Real Client Onboarding Script
 * Quick script to create merchant accounts for real client onboarding
 * 
 * Usage: node create-client-script.js "Client Name" "client@email.com" "client-webhook-url"
 * Example: node create-client-script.js "Gaming Website" "admin@gaming.com" "https://gaming.com/webhook"
 */

const crypto = require('crypto');

// Configuration
const BACKEND_URL = 'https://web-production-0b337.up.railway.app/api/v1';
const ADMIN_API_KEY = 'admin_test_key';

// Generate secure API credentials
function generateApiCredentials() {
    const api_key = 'lsp_' + crypto.randomBytes(16).toString('hex');
    const api_salt = 'salt_' + crypto.randomBytes(32).toString('hex');
    return { api_key, api_salt };
}

// Create merchant account
async function createMerchant(name, email, webhookUrl) {
    const credentials = generateApiCredentials();
    
    const merchantData = {
        merchant_name: name,
        email: email,
        phone: '+91 9999999999', // Default phone
        business_type: 'online',
        webhook_url: webhookUrl,
        api_key: credentials.api_key,
        api_salt: credentials.api_salt,
        is_active: true,
        is_sandbox: false, // Start with production ready
        fee_percent: 3.0, // 3% commission
        wallet_balance: 0
    };

    try {
        const response = await fetch(`${BACKEND_URL}/admin/merchants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ADMIN_API_KEY
            },
            body: JSON.stringify(merchantData)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            return {
                success: true,
                merchant: result.merchant,
                credentials: credentials
            };
        } else {
            return {
                success: false,
                error: result.error || 'Unknown error'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Test payment endpoint
async function testPaymentEndpoint(credentials) {
    const testPayment = {
        amount: 100, // ₹1 test
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        test_mode: true
    };

    try {
        const response = await fetch(`${BACKEND_URL}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': credentials.api_key,
                'x-api-secret': credentials.api_salt
            },
            body: JSON.stringify(testPayment)
        });

        const result = await response.json();
        return {
            success: response.ok && result.success,
            result: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log('❌ Usage: node create-client-script.js "Client Name" "client@email.com" "webhook-url"');
        console.log('📋 Example: node create-client-script.js "Gaming Website" "admin@gaming.com" "https://gaming.com/webhook"');
        process.exit(1);
    }

    const [clientName, clientEmail, webhookUrl] = args;

    console.log('🚀 Creating Real Client Account...\n');
    console.log(`👤 Client: ${clientName}`);
    console.log(`📧 Email: ${clientEmail}`);
    console.log(`🔗 Webhook: ${webhookUrl}\n`);

    // Step 1: Create merchant account
    console.log('⏳ Creating merchant account...');
    const merchantResult = await createMerchant(clientName, clientEmail, webhookUrl);

    if (!merchantResult.success) {
        console.log('❌ Failed to create merchant account:', merchantResult.error);
        process.exit(1);
    }

    console.log('✅ Merchant account created successfully!\n');

    // Step 2: Test payment endpoint
    console.log('⏳ Testing payment endpoint...');
    const paymentTest = await testPaymentEndpoint(merchantResult.credentials);

    if (!paymentTest.success) {
        console.log('⚠️ Payment endpoint test failed:', paymentTest.error);
        console.log('🔧 Account created but needs verification\n');
    } else {
        console.log('✅ Payment endpoint test successful!\n');
    }

    // Step 3: Display client credentials
    console.log('🎯 CLIENT INTEGRATION DETAILS:');
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔑 API Credentials:');
    console.log(`   API Key: ${merchantResult.credentials.api_key}`);
    console.log(`   API Salt: ${merchantResult.credentials.api_salt}\n`);
    
    console.log('🌐 API Endpoints:');
    console.log(`   Payment URL: ${BACKEND_URL}/pay`);
    console.log(`   Webhook URL: https://api.lightspeedpay.in/api/v1/callback/easebuzzp\n`);
    
    console.log('📝 Sample Payment Code:');
    console.log(`   curl -X POST ${BACKEND_URL}/pay \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -H "x-api-key: ${merchantResult.credentials.api_key}" \\`);
    console.log(`     -H "x-api-secret: ${merchantResult.credentials.api_salt}" \\`);
    console.log(`     -d '{"amount":10000,"customer_email":"user@example.com"}'\n`);
    
    console.log('🔧 EaseBuzz Dashboard Setup:');
    console.log('   Webhook URL: https://api.lightspeedpay.in/api/v1/callback/easebuzzp');
    console.log('   Success URL: https://client-website.com/success');
    console.log('   Failure URL: https://client-website.com/failed\n');
    
    console.log('🎉 CLIENT READY FOR INTEGRATION!');
    console.log('═══════════════════════════════════════');
}

// Execute
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createMerchant, testPaymentEndpoint }; 