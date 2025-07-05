import { redirect } from 'next/navigation';
import { getSupabaseService } from '@/lib/supabase/server';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { txnId: string };
}

export default async function CheckoutPage({ params }: PageProps) {
  const supabase = getSupabaseService();
  
  // Get transaction details
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', params.txnId)
    .single();

  if (error || !transaction) {
    redirect('/failed');
  }

  // If already processed, redirect to appropriate page
  if (transaction.status === 'completed') {
    redirect('/success');
  }
  
  if (transaction.status === 'failed') {
    redirect('/failed');
  }

  // For pending transactions, redirect to payment gateway
  if (transaction.payment_url) {
    redirect(transaction.payment_url);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Processing Payment
          </h1>
          <p className="text-gray-600 mb-6">
            Please wait while we process your payment...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 