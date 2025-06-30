import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

// POST /api/v1/admin/clients/[clientId]/credentials/regenerate - Regenerate client credentials
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = params;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!supabaseService) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Check if client exists
    const { data: existingClient, error: checkError } = await supabaseService
      .from('clients')
      .select('id, company_name, client_key')
      .eq('id', clientId)
      .single();

    if (checkError || !existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Generate new credentials
    const newClientKey = `sk_live_${randomBytes(16).toString('hex')}`;
    const newClientSalt = `salt_${randomBytes(24).toString('hex')}`;

    // Update client with new credentials
    const { data: updatedClient, error: updateError } = await supabaseService
      .from('clients')
      .update({
        client_key: newClientKey,
        client_salt: newClientSalt,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select('id, company_name, client_key, client_salt')
      .single();

    if (updateError) {
      console.error('[CREDENTIALS REGENERATE] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to regenerate credentials' }, { status: 500 });
    }

    // Insert audit log
    await supabaseService
      .from('audit_logs')
      .insert({
        action: 'CREDENTIALS_REGENERATED',
        details: {
          client_id: clientId,
          company_name: existingClient.company_name,
          old_key: existingClient.client_key,
          new_key: newClientKey
        },
        performed_by: 'admin'
      });

    return NextResponse.json({
      success: true,
      message: 'Credentials regenerated successfully',
      client: {
        id: updatedClient.id,
        company_name: updatedClient.company_name,
        client_key: updatedClient.client_key,
        client_salt: updatedClient.client_salt,
        webhook_url: `https://api.lightspeedpay.com/webhook/${updatedClient.client_key}`
      }
    });

  } catch (err: any) {
    console.error('[CREDENTIALS REGENERATE] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 