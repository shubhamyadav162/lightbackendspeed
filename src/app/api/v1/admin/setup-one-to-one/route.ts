import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate unique client credentials
function generateClientKey(): string {
  return `lsp_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
}

function generateClientSalt(): string {
  return Math.random().toString(36).substring(2, 22).toUpperCase()
}

function generateCompanyName(merchantId: string): string {
  return `Merchant_${merchantId.substring(0, 8)}`
}

// Add function to generate unique gateway code
function generateGatewayCode(): string {
  return `LSPGW_${Math.random().toString(36).substring(2, 12).toUpperCase()}`
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 One-to-One Setup Request Received v2')
    
    const body = await req.json()
    const { merchantId, apiKey, apiSalt, apiUrl = 'https://pay.easebuzz.in/payment/initiateLink' } = body

    // Validate required fields
    if (!merchantId || !apiKey || !apiSalt) {
      console.log('❌ Missing required fields:', { merchantId, apiKey: !!apiKey, apiSalt: !!apiSalt })
      return NextResponse.json({
        success: false,
        error: 'Merchant ID, API Key और API Salt सभी required हैं'
      }, { status: 400 })
    }

    console.log('✅ Processing One-to-One Setup for Merchant:', { merchantId })

    // Step 1: Verify the merchant (client) exists
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('id', merchantId)
      .single();

    if (clientError || !clientData) {
      console.error('❌ Merchant not found:', clientError);
      return NextResponse.json({
        success: false,
        error: 'Merchant ID અમાન્ય છે અથવા મળ્યો નથી.',
        details: clientError?.message
      }, { status: 404 });
    }

    console.log('✅ Merchant verified:', clientData.company_name);

    // Step 2: Check for an existing Easebuzz gateway for this merchant
    const { data: existingGateway, error: existingGatewayError } = await supabase
        .from('payment_gateways')
        .select('id')
        .eq('client_id', merchantId)
        .eq('provider', 'easebuzz')
        .maybeSingle();

    if (existingGatewayError) {
        console.error('❌ Error checking for existing gateway:', existingGatewayError);
        // Do not return here, proceed to create if it's a "not found" type error
    }

    let gatewayData;

    if (existingGateway) {
        // Step 3a: Update existing gateway
        console.log('🔄 Gateway already exists. Updating credentials for gateway ID:', existingGateway.id);
        const { data: updatedGateway, error: updateError } = await supabase
            .from('payment_gateways')
            .update({
                api_key: apiKey,
                api_secret: apiSalt,
                webhook_url: apiUrl,
                is_active: true
            })
            .eq('id', existingGateway.id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Supabase gateway update error:', updateError);
            return NextResponse.json({
                success: false,
                error: 'मौजूदा गेटवे को अपडेट करने में त्रुटि हुई।',
                details: updateError.message
            }, { status: 500 });
        }
        gatewayData = updatedGateway;
        console.log('✅ Gateway updated successfully.');

    } else {
        // Step 3b: Create a new gateway
        console.log('✨ No existing gateway found. Creating a new one.');
        const gatewayName = `EaseBuzz_${clientData.company_name.replace(/\s+/g, '_')}`;
        const { data: newGateway, error: gatewayError } = await supabase
            .from('payment_gateways')
            .insert({
                name: gatewayName,
                provider: 'easebuzz',
                api_key: apiKey,
                api_secret: apiSalt,
                webhook_url: apiUrl,
                client_id: merchantId, // Associate with the client
                is_active: true,
                // Add other necessary default fields
                monthly_limit: 1000000,
                priority: 1,
            })
            .select()
            .single();

        if (gatewayError) {
            console.error('❌ Supabase gateway creation error:', gatewayError);
            return NextResponse.json({
                success: false,
                error: 'Gateway creation में error आया',
                details: gatewayError.message
            }, { status: 500 });
        }
        gatewayData = newGateway;
        console.log('✅ New gateway created successfully:', gatewayData.id);
    }
    
    // Step 4: Ensure wallet exists (optional, based on your logic)
    // You might want to add a check here to create a wallet if one doesn't exist for the client

    const response = {
      success: true,
      data: {
        gateway: {
          id: gatewayData.id,
          name: gatewayData.name,
          provider: 'easebuzz',
          status: 'active'
        },
      },
      message: 'Easebuzz gateway configuration saved successfully!'
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error: any) {
    console.error('❌ One-to-One Setup Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error occurred',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'One-to-One Setup API is working',
    endpoints: {
      POST: 'Create one-to-one client-gateway mapping',
      required_fields: ['merchantId', 'apiKey', 'apiSalt'],
      optional_fields: ['apiUrl']
    }
  })
} 