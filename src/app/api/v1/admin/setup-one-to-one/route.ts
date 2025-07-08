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

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 One-to-One Setup Request Received')
    
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

    console.log('✅ Creating One-to-One Setup for:', { merchantId, apiUrl })

    // Generate LightSpeed client credentials
    const clientKey = generateClientKey()
    const clientSalt = generateClientSalt()
    const companyName = generateCompanyName(merchantId)

    // Start database transaction
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        client_key: clientKey,
        client_salt: clientSalt,
        company_name: companyName,
        webhook_url: null,
        fee_percent: 3.50,
        suspend_threshold: 10000,
        status: 'active'
      })
      .select()
      .single()

    if (clientError) {
      console.log('❌ Client creation error:', clientError)
      return NextResponse.json({
        success: false,
        error: 'Client creation में error आया'
      }, { status: 500 })
    }

    console.log('✅ Client created:', clientData.id)

    // Create dedicated EaseBuzz gateway for this client
    const gatewayName = `EaseBuzz_${merchantId}_${Date.now()}`
    const { data: gatewayData, error: gatewayError } = await supabase
      .from('payment_gateways')
      .insert({
        name: gatewayName,
        provider: 'easebuzz',
        api_key: apiKey,
        api_secret: apiSalt,
        webhook_url: apiUrl,
        environment: 'production',
        monthly_limit: 1000000,
        current_volume: 0,
        success_rate: 100.00,
        priority: 1,
        is_active: true,
        temp_failed: false
      })
      .select()
      .single()

    if (gatewayError) {
      console.log('❌ Gateway creation error:', gatewayError)
      
      // Rollback: Delete the client
      await supabase.from('clients').delete().eq('id', clientData.id)
      
      return NextResponse.json({
        success: false,
        error: 'Gateway creation में error आया'
      }, { status: 500 })
    }

    console.log('✅ Gateway created:', gatewayData.id)

    // Create 1:1 client-gateway assignment
    const { error: assignmentError } = await supabase
      .from('client_gateway_assignments')
      .insert({
        client_id: clientData.id,
        gateway_id: gatewayData.id,
        rotation_order: 1,
        is_active: true,
        weight: 1.00,
        daily_limit: 1000000,
        daily_usage: 0
      })

    if (assignmentError) {
      console.log('❌ Assignment creation error:', assignmentError)
      
      // Rollback: Delete client and gateway
      await supabase.from('clients').delete().eq('id', clientData.id)
      await supabase.from('payment_gateways').delete().eq('id', gatewayData.id)
      
      return NextResponse.json({
        success: false,
        error: '1:1 mapping creation में error आया'
      }, { status: 500 })
    }

    console.log('✅ 1:1 Assignment created successfully')

    // Create commission wallet
    const { error: walletError } = await supabase
      .from('commission_wallets')
      .insert({
        client_id: clientData.id,
        balance_due: 0,
        warn_threshold: 5000
      })

    if (walletError) {
      console.log('❌ Wallet creation error:', walletError)
      // Rollback: Delete client, gateway, and assignment
      await supabase.from('clients').delete().eq('id', clientData.id)
      await supabase.from('payment_gateways').delete().eq('id', gatewayData.id)
      await supabase.from('client_gateway_assignments').delete().eq('client_id', clientData.id)

      return NextResponse.json({
        success: false,
        error: 'Wallet creation में error आया'
      }, { status: 500 })
    }

    console.log('✅ Commission wallet created')
    
    // Return all created data
    return NextResponse.json({
      success: true,
      message: 'One-to-One setup completed successfully!',
      client: clientData,
      gateway: gatewayData
    })

  } catch (err: any) {
    console.error('❌ One-to-One Setup Error:', err.message)
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred.',
      details: err.message
    }, { status: 500 })
  }
}

// Optional: Add GET handler to check status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const merchantId = searchParams.get('merchantId')

  if (!merchantId) {
    return NextResponse.json({
      success: false,
      error: 'Merchant ID is required as a query parameter'
    }, { status: 400 })
  }

  // Check client, gateway, assignment, and wallet
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, company_name, client_key, status')
    .eq('id', merchantId)
    .single()
  
  const { data: gateway, error: gwErr } = await supabase
    .from('payment_gateways')
    .select('id, name, provider, is_active')
    .eq('client_id', merchantId)
    .eq('provider', 'easebuzz')
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ success: false, message: 'Merchant not found' }, { status: 404 })
  }
  if (gwErr || !gateway) {
    return NextResponse.json({ success: false, message: 'Gateway for merchant not found', client })
  }
  
  return NextResponse.json({
    success: true,
    message: 'Merchant and Gateway are configured.',
    client,
    gateway
  })
} 