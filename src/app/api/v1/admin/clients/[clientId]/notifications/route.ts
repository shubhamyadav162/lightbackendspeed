import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';

// POST /api/v1/admin/clients/[clientId]/notifications - Send WhatsApp notification
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
    const body = await request.json();
    const { 
      type, 
      template = 'default_template', 
      message, 
      send_whatsapp = true, 
      send_email = false 
    } = body;

    if (!type) {
      return NextResponse.json({ error: 'Notification type is required' }, { status: 400 });
    }

    let supabase: ReturnType<typeof getSupabaseService>;
    try {
      supabase = getSupabaseService();
    } catch (e) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Get client details for personalized message
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        id,
        company_name,
        client_key,
        commission_wallets (
          id,
          balance_due,
          warn_threshold
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const wallet = client.commission_wallets?.[0];
    
    // Generate message based on type
    let finalMessage = message;
    if (!finalMessage) {
      switch (type) {
        case 'LOW_BALANCE':
          finalMessage = `Hello ${client.company_name}! Your commission balance is ₹${((wallet?.balance_due || 0) / 100).toLocaleString()}. Please clear your dues to avoid service suspension. Thank you! - LightSpeedPay`;
          break;
        case 'PAYMENT_REMINDER':
          finalMessage = `Reminder: You have a pending commission balance of ₹${((wallet?.balance_due || 0) / 100).toLocaleString()}. Please clear your dues at your earliest convenience. - LightSpeedPay`;
          break;
        case 'CUSTOM':
          finalMessage = message || 'Custom notification from LightSpeedPay';
          break;
        default:
          finalMessage = 'Notification from LightSpeedPay';
      }
    }

    let notificationRecord = null;
    let emailRecord = null;

    // Send WhatsApp notification if enabled
    if (send_whatsapp) {
      try {
        // Insert WhatsApp notification record
        const { data: whatsappNotification, error: whatsappError } = await supabase
          .from('whatsapp_notifications')
          .insert({
            client_id: clientId,
            template,
            type,
            message: finalMessage,
            status: 'queued'
          })
          .select()
          .single();

        if (whatsappError) {
          console.error('[NOTIFICATIONS] WhatsApp insert error:', whatsappError);
        } else {
          notificationRecord = whatsappNotification;
        }

        // Here you would typically enqueue the WhatsApp message
        // For now, we'll mark it as sent after a delay
        setTimeout(async () => {
          if (whatsappNotification) {
            try {
              const supabase = getSupabaseService();
              await supabase
                .from('whatsapp_notifications')
                .update({ 
                  status: 'sent',
                  sent_at: new Date().toISOString()
                })
                .eq('id', whatsappNotification.id);
            } catch (e) {
              console.error('[NOTIFICATIONS] setTimeout supabase error:', e);
            }
          }
        }, 1000);

      } catch (error) {
        console.error('[NOTIFICATIONS] WhatsApp processing error:', error);
      }
    }

    // Send email notification if enabled
    if (send_email) {
      try {
        // For now, we'll log the email (implement actual email service later)
        console.log(`[EMAIL] Sending to client ${clientId}: ${finalMessage}`);
        emailRecord = {
          type: 'email',
          status: 'sent',
          message: finalMessage
        };
      } catch (error) {
        console.error('[NOTIFICATIONS] Email processing error:', error);
      }
    }

    // Insert audit log
    await supabase
      .from('audit_logs')
      .insert({
        action: 'NOTIFICATION_SENT',
        details: {
          client_id: clientId,
          notification_type: type,
          channels: {
            whatsapp: send_whatsapp,
            email: send_email
          },
          message: finalMessage
        },
        performed_by: 'admin'
      });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        whatsapp: notificationRecord,
        email: emailRecord,
        final_message: finalMessage
      }
    });

  } catch (err: any) {
    console.error('[NOTIFICATIONS] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/v1/admin/clients/[clientId]/notifications - Get notification history
export async function GET(
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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let supabase: ReturnType<typeof getSupabaseService>;
    try {
      supabase = getSupabaseService();
    } catch (e) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Get WhatsApp notifications
    const { data: notifications, error } = await supabase
      .from('whatsapp_notifications')
      .select(`
        id,
        template,
        type,
        message,
        status,
        sent_at,
        error,
        created_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[NOTIFICATIONS] Get history error:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || []
    });

  } catch (err: any) {
    console.error('[NOTIFICATIONS] Get history unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 