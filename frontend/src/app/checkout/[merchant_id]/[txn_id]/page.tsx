'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Mock QR code image for demo purposes
const QR_CODE_URL = 'data:image/png;base64,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';

const paymentMethods = [
  {
    id: 'upi',
    name: 'UPI Payment',
    icon: 'UPI',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    description: 'Pay using any UPI app',
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'CC',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    description: 'Pay using credit or debit card',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: 'NB',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    description: 'Pay using your bank account',
  },
  {
    id: 'wallet',
    name: 'Wallets',
    icon: 'WA',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    description: 'Pay using digital wallets',
  }
];

const upiApps = [
  { id: 'gpay', name: 'Google Pay', logo: 'GPay' },
  { id: 'phonepe', name: 'PhonePe', logo: 'PhonePe' },
  { id: 'paytm', name: 'Paytm', logo: 'Paytm' }
];

export default function CheckoutPage({ params }: { params: { merchant_id: string; txn_id: string } }) {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isLoading, setIsLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleUpiAppClick = (appId: string) => {
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to success page or show success message
    }, 2000);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to success page or show success message
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Panel - Payment Selection */}
          <div className="md:w-1/2 p-6 md:p-8 lg:p-10">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                L
              </div>
              <h1 className="text-xl font-semibold">LightSpeedPay</h1>
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Complete Your Payment</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Secure payment processing by LightSpeedPay
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400">Merchant</span>
                <span className="font-medium">Test Merchant</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400">Amount</span>
                <span className="font-bold text-lg">₹1,299.99</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                <span className="text-sm font-mono">{params.txn_id}</span>
              </div>
            </div>

            <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <button 
                  key={method.id}
                  className={`w-full flex items-center p-4 border rounded-lg transition-all ${
                    selectedMethod === method.id 
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                >
                  <div className={`h-10 w-10 ${method.bgColor} rounded-full flex items-center justify-center mr-4`}>
                    <span className={`${method.textColor} font-bold`}>{method.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{method.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Order Tracking Link */}
            <div className="text-center mt-10">
              <Link href={`/orders/track/${params.txn_id}`} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                Track your order status
              </Link>
            </div>
          </div>

          {/* Right Panel - Payment Details */}
          <div className="md:w-1/2 bg-gray-50 dark:bg-gray-900 p-6 md:p-8 lg:p-10">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-medium mb-2">Processing Payment</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Please wait while we process your payment. Do not close this window.
                </p>
              </div>
            ) : selectedMethod === 'upi' ? (
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-medium mb-6">Scan QR Code to Pay</h3>
                <div className="bg-white p-4 rounded-lg shadow-md mb-8">
                  <div className="h-64 w-64 relative">
                    <Image 
                      src={QR_CODE_URL} 
                      alt="UPI QR Code" 
                      width={256} 
                      height={256}
                      className="rounded-md"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
                  Open your UPI app, scan the QR code, and confirm the payment
                </p>
                <div className="w-full">
                  <h4 className="text-lg font-medium mb-4">Pay using UPI App</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {upiApps.map((app) => (
                      <button 
                        key={app.id}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center"
                        onClick={() => handleUpiAppClick(app.id)}
                      >
                        <div className="h-12 w-12 flex items-center justify-center text-sm font-medium mb-2">
                          {app.logo}
                        </div>
                        <span className="text-sm">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedMethod === 'card' ? (
              <div>
                <h3 className="text-xl font-medium mb-6">Enter Card Details</h3>
                <form onSubmit={handleCardSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Card Number</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="John Doe"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CVV</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                        placeholder="123"
                        maxLength={4}
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-lg transition-colors"
                  >
                    Pay ₹1,299.99
                  </button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secured by LightSpeedPay
                  </p>
                </div>
              </div>
            ) : selectedMethod === 'netbanking' ? (
              <div>
                <h3 className="text-xl font-medium mb-6">Select Your Bank</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank', 'Yes Bank'].map((bank) => (
                    <button 
                      key={bank}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                      onClick={() => setIsLoading(true)}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
                <div className="mt-8">
                  <label className="block text-sm font-medium mb-2">Other Banks</label>
                  <select className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <option value="">Select Bank</option>
                    <option>Bank of Baroda</option>
                    <option>Punjab National Bank</option>
                    <option>Bank of India</option>
                    <option>Canara Bank</option>
                    <option>Union Bank</option>
                  </select>
                </div>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-lg transition-colors mt-6"
                  onClick={() => setIsLoading(true)}
                >
                  Continue to Bank
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-medium mb-6">Select Wallet</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'MobiKwik'].map((wallet) => (
                    <button 
                      key={wallet}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                      onClick={() => setIsLoading(true)}
                    >
                      {wallet}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Security Badges */}
      <div className="max-w-6xl mx-auto mt-8 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          256-bit Encryption
        </div>
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          PCI DSS Compliant
        </div>
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure Transaction
        </div>
      </div>
    </div>
  );
} 