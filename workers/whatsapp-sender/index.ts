import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REDIS_URL = process.env.REDIS_URL!;
const WA_API_URL = process.env.WA_API_URL!;
const WA_API_KEY = process.env.WA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 WhatsApp sender worker started');

// This is a placeholder for the actual WhatsApp sending logic.
// In a real application, this would interact with a WhatsApp Business API provider.
async function sendWhatsAppMessage(payload: any) {
  console.log('Sending WhatsApp message with payload:', JSON.stringify(payload, null, 2));
  
  // Example of calling a real WhatsApp API
  /*
  const response = await fetch(WA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WA_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp API failed with status ${response.status}: ${errorBody}`);
  }

  const responseData = await response.json();
  console.log('WhatsApp message sent successfully:', responseData);
  return responseData;
  */
  
  // For now, we'll just simulate a successful send.
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message_id: `wa_mock_${Date.now()}` };
}

const worker = new Worker('whatsapp-notifications', async (job) => {
  const { client_id, template, payload } = job.data;
  const notificationId = job.id; // Assuming job ID can be used to track the notification

  console.log(`Processing WhatsApp notification job ${notificationId} for client ${client_id}`);

  try {
    // 1. Send the notification via the provider's API
    await sendWhatsAppMessage(payload);

    // 2. Update the notification status in the database to 'sent'
    const { error: updateError } = await supabase
      .from('whatsapp_notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', notificationId); // This assumes the DB record ID is the same as the job ID.

    if (updateError) {
      // If the update fails, we still sent the message, so we just log the error.
      console.error(`Failed to update notification status for job ${notificationId}:`, updateError.message);
    }

    console.log(`✅ WhatsApp notification ${notificationId} sent successfully.`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`❌ Failed to send WhatsApp notification ${notificationId}:`, errorMessage);

    // Update the notification status to 'failed'
    await supabase
      .from('whatsapp_notifications')
      .update({ status: 'failed', error: errorMessage })
      .eq('id', notificationId);

    throw error; // Re-throw to let BullMQ handle retries
  }
}, {
  connection: { url: REDIS_URL },
  concurrency: parseInt(process.env.MAX_CONCURRENCY_WHATSAPP || '30', 10),
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
});

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
  } else {
    console.error(`A job failed with error: ${err.message}`);
  }
}); 