import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, ArrowRight, CreditCard } from 'lucide-react';

export const KeySaltWrapperInfo: React.FC = () => {
  return (
    <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>How LightSpeedPay Key-Salt Wrapper Works</span>
          <Badge className="bg-blue-600 text-white">Single Integration</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-sm mb-2">1. Generate Credentials</h3>
            <p className="text-xs text-gray-600">
              System auto-generates <strong>client_key</strong>, <strong>client_salt</strong>, and <strong>webhook_url</strong> for each merchant
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-sm mb-2">2. Route to 20+ Gateways</h3>
            <p className="text-xs text-gray-600">
              Single credentials automatically route to <strong>Razorpay, PayU, Cashfree, PhonePe, Paytm</strong> और 15+ other PSPs
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border">
          <h4 className="font-medium text-sm mb-2">🔧 Technical Benefits:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-green-700">✅ <strong>Single Integration:</strong> One API for all gateways</p>
              <p className="text-green-700">✅ <strong>Auto Failover:</strong> Switch between PSPs instantly</p>
              <p className="text-green-700">✅ <strong>Load Balancing:</strong> Distribute across multiple accounts</p>
            </div>
            <div>
              <p className="text-blue-700">🔒 <strong>Secure:</strong> HMAC-signed requests</p>
              <p className="text-blue-700">🚀 <strong>Scalable:</strong> Handle 2M+ transactions/day</p>
              <p className="text-blue-700">📊 <strong>Analytics:</strong> Unified reporting across all PSPs</p>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-gray-900 rounded-lg">
          <p className="text-xs text-green-400 font-mono">
            // Merchant Integration Example<br/>
            POST https://api.lightspeedpay.com/payment/initiate<br/>
            Headers: X-Client-Key, X-Client-Salt<br/>
            → Routes to best available PSP automatically
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 