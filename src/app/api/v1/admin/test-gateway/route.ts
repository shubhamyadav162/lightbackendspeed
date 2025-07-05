import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';
import { Girth1PaymentAdapter } from '../../../../../lib/gateways/girth1payment-adapter';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Admin Test Gateway Request Received');
    
    // Get Supabase client
    const supabase = getSupabaseService();
    
    // Get request body
    const body = await request.json();
    const { gateway_provider } = body;
    
    console.log('🔧 Testing Gateway Provider:', gateway_provider);
    
    // Validate required fields
    if (!gateway_provider) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: gateway_provider'
      }, { status: 400 });
    }
    
    // Handle 1Payment (Girth1Payment) specifically
    if (gateway_provider === 'girth1payment') {
      console.log('🚀 Testing 1Payment connection...');
      
      // Get Girth1Payment gateway configuration from database
      const { data: gateway, error: gatewayError } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('provider', 'girth1payment')
        .eq('is_active', true)
        .single();
      
      if (gatewayError || !gateway) {
        console.error('❌ Girth1Payment gateway not found:', gatewayError);
        return NextResponse.json({
          success: false,
          error: 'Girth1Payment gateway not configured or inactive'
        }, { status: 404 });
      }
      
      console.log('✅ Found Girth1Payment gateway:', gateway.name);
      
      // Test API connection with a minimal request
      try {
        const adapter = new Girth1PaymentAdapter(gateway.credentials);
        
        // Test payment initiation with minimal data to check API connectivity
        const testResult = await adapter.initiatePayment({
          amount: 1, // 1 unit for testing
          currency: 'INR',
          order_id: `TEST_${Date.now()}`,
          customer_info: {
            name: 'Test User',
            email: 'test@lightspeedpay.com',
            phone: '+919999999999'
          },
          description: 'API Connection Test',
          return_url: 'https://lightspeedpay.in/test'
        });
        
        if (testResult.success) {
          console.log('✅ 1Payment API connection successful');
          return NextResponse.json({
            success: true,
            message: '1Payment API connection successful',
            gateway_name: gateway.name,
            provider: 'girth1payment',
            test_details: {
              response_time: 'Available',
              api_status: 'Active',
              payment_url_generated: !!testResult.checkout_url
            }
          });
        } else {
          console.log('⚠️ 1Payment API responded but with error:', testResult.error);
          return NextResponse.json({
            success: false,
            error: testResult.error || '1Payment API test failed',
            gateway_name: gateway.name,
            provider: 'girth1payment'
          }, { status: 400 });
        }
        
      } catch (testError: any) {
        console.error('❌ 1Payment API connection failed:', testError);
        return NextResponse.json({
          success: false,
          error: `1Payment API connection failed: ${testError.message}`,
          gateway_name: gateway.name,
          provider: 'girth1payment'
        }, { status: 500 });
      }
    }
    
    // Handle other gateway providers
    return NextResponse.json({
      success: false,
      error: `Gateway provider '${gateway_provider}' test not supported yet`
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Admin Test Gateway Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Admin Test Gateway API',
    version: '1.0.0',
    supported_gateways: ['girth1payment'],
    endpoints: {
      POST: '/api/v1/admin/test-gateway'
    }
  });
} 