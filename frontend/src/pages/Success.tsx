import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const Success = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const orderId = searchParams.get('order_id');

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-lg w-full text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-800 mt-4">Payment Successful!</h1>
        <p className="text-gray-600 mt-2">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>
        <div className="mt-6 text-left bg-gray-50 p-4 rounded-md border">
          <p className="text-sm text-gray-500">
            Order ID: <span className="font-mono text-gray-800">{orderId}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Payment ID: <span className="font-mono text-gray-800">{paymentId}</span>
          </p>
        </div>
        <Link
          to="/"
          className="mt-8 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default Success; 