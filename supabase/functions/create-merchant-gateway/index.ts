import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { randomBytes } from 'https://deno.land/std@0.110.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to generate random strings for keys and salts
const generateRandomString = (length: number): string => {
  return randomBytes(length).toString('hex')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyName, easebuzzKey, easebuzzSalt } = await req.json()

    if (!companyName || !easebuzzKey || !easebuzzSalt) {
      return new Response(JSON.stringify({ error: 'Company name, Easebuzz key, and salt are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // It's recommended to store sensitive URLs and Keys in environment variables
    // In Supabase Edge Functions, these can be set in the project's dashboard
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // The base URL for your backend where webhooks are handled.
    // This should be configured as an environment variable in your Supabase project settings.
    const railwayUrl = Deno.env.get('RAILWAY_BACKEND_URL') || 'https://your-backend.up.railway.app'

    // 1. Generate unique Lightspeed credentials and webhook URL
    const lightspeedClientKey = `ls_key_${generateRandomString(16)}`
    const lightspeedClientSalt = generateRandomString(32)
    const webhookId = crypto.randomUUID()
    const webhookUrl = `${railwayUrl}/api/webhooks/easebuzz/${webhookId}`

    // 2. Insert all details into the new merchant_credentials table
    const { data, error } = await supabaseAdmin
      .from('merchant_credentials')
      .insert({
        company_name: companyName,
        easebuzz_key: easebuzzKey,     // For production, you should encrypt this value before storing
        easebuzz_salt: easebuzzSalt,    // For production, you should encrypt this value before storing
        lightspeed_client_key: lightspeedClientKey,
        lightspeed_client_salt: lightspeedClientSalt,
        webhook_url: webhookUrl,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      // Provide a more specific error message if possible
      if (error.code === '23505') { // Unique constraint violation
        return new Response(JSON.stringify({ error: 'A credential with the same unique key already exists.' }), {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`Failed to create merchant credentials: ${error.message}`)
    }

    // 3. Return the newly generated credentials to the frontend
    const responsePayload = {
      merchantId: data.id,
      clientKey: data.lightspeed_client_key,
      clientSalt: data.lightspeed_client_salt,
      webhookUrl: data.webhook_url,
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error processing request:', err)
    return new Response(JSON.stringify({ error: err.message || 'An unexpected error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}) 