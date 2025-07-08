import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const Failed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-lg w-full text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-800 mt-4">Payment Failed</h1>
        <p className="text-gray-600 mt-2">
          Unfortunately, we were unable to process your payment. This could be due to a network issue or the payment being cancelled.
        </p>
        {orderId && (
          <div className="mt-6 text-left bg-gray-50 p-4 rounded-md border">
            <p className="text-sm text-gray-500">
              Order ID: <span className="font-mono text-gray-800">{orderId}</span>
            </p>
          </div>
        )}
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

export default Failed; 