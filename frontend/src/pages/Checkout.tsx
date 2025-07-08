import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- Helper Functions ---

// Dynamically load an external script
const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// --- Easebuzz Form Component ---
interface EasebuzzFormProps {
  details: any;
  env: 'test' | 'production';
}

const EasebuzzForm: React.FC<EasebuzzFormProps> = ({ details, env }) => {
    const formRef = useRef<HTMLFormElement>(null);
    const easebuzzUrl = env === 'test' 
        ? 'https://testpay.easebuzz.in/payment/initiateLink'
        : 'https://pay.easebuzz.in/payment/initiateLink';

    useEffect(() => {
        // Auto-submit the form once it's rendered
        if (formRef.current) {
            formRef.current.submit();
        }
    }, []);

    const amountInRupees = (details.amount / 100).toFixed(2);

    return (
        <form
            ref={formRef}
            action={easebuzzUrl}
            method="POST"
            className="hidden"
        >
            <input type="hidden" name="key" value={details.easebuzz_key} />
            <input type="hidden" name="txnid" value={details.easebuzz_txnid} />
            <input type="hidden" name="hash" value={details.easebuzz_hash} />
            <input type="hidden" name="amount" value={amountInRupees} />
            <input type="hidden" name="firstname" value={details.customer_name || 'Customer'} />
            <input type="hidden" name="email" value={details.customer_email || ''} />
            <input type="hidden" name="phone" value={details.customer_phone || ''} />
            <input type="hidden" name="productinfo" value={`Order: ${details.order_id}`} />
            <input type="hidden" name="surl" value={details.redirect_url || `${window.location.origin}/success`} />
            <input type="hidden" name="furl" value={details.redirect_url || `${window.location.origin}/failed`} />
        </form>
    );
};


// --- Main Checkout Component ---

const Checkout = () => {
  const { id: transactionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (!transactionId) {
        setError('No transaction ID provided.');
        setLoading(false);
        return;
      }

      // 1. Fetch unified checkout details from our backend
      let checkoutDetails;
      try {
        // This backend endpoint should fetch data from the `client_transactions` table
        // and return the unified format.
        const response = await fetch(`/api/v1/payments/${transactionId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch payment details: ${response.statusText}`);
        }
        checkoutDetails = await response.json();
        setPaymentDetails(checkoutDetails);

      } catch (err: any) {
        setError(err.message || 'Could not connect to the payment server.');
        setLoading(false);
        return;
      }

      // 2. Process payment based on provider
      if (checkoutDetails.provider === 'razorpay') {
        const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!scriptLoaded) {
          setError('Failed to load payment gateway script. Please check your network.');
          setLoading(false);
          return;
        }
        
        const options = {
            key: checkoutDetails.razorpay_key_id,
            amount: checkoutDetails.amount,
            currency: 'INR',
            name: 'LightSpeedPay',
            description: `Payment for Order ${checkoutDetails.order_id}`,
            order_id: checkoutDetails.razorpay_order_id,
            handler: function (response: any) {
                navigate(`/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`);
            },
            prefill: {
                email: checkoutDetails.customer_email,
                contact: checkoutDetails.customer_phone,
            },
            theme: {
                color: '#ff6b00', // LightSpeedPay brand color
            },
            modal: {
                ondismiss: function () {
                    navigate(`/failed?order_id=${checkoutDetails.order_id}`);
                },
            },
        };

        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();

      } else if (checkoutDetails.provider === 'easebuzz') {
        // The EasebuzzForm component will handle the redirection automatically.
        // We just need to render it.
        setLoading(false); // Stop loading to render the form
      } else {
        setError(`Unsupported payment provider: ${checkoutDetails.provider}`);
        setLoading(false);
      }
    };

    processPayment();
  }, [transactionId, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h1>
          <p className="text-gray-700">{error}</p>
          <button onClick={() => navigate('/')} className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Render Easebuzz form if provider is easebuzz and details are ready
  if (paymentDetails && paymentDetails.provider === 'easebuzz') {
    return <EasebuzzForm details={paymentDetails} env="test" />; // Use 'production' for live
  }

  // Default loading/redirecting screen
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">LightSpeed Checkout</h1>
        <div className="space-y-4">
          <p className="text-gray-600">
            {loading ? 'Preparing your secure payment...' : 'Redirecting to payment gateway...'}
          </p>
          <div className="p-4 border rounded-md bg-gray-50">
            <p className="text-sm text-gray-500">Transaction ID:</p>
            <p className="font-mono text-gray-800 break-all">{transactionId}</p>
          </div>
          <div className="flex items-center justify-center pt-4">
            <svg className="animate-spin h-8 w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 