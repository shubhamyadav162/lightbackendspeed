import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Copy, TestTube, CreditCard, Key, Shield, Globe } from 'lucide-react'
import { apiService } from '@/services/api'

interface SetupResponse {
  success: boolean
  data?: {
    client: {
      id: string
      client_key: string
      client_salt: string
      company_name: string
      status: string
    }
    gateway: {
      id: string
      name: string
      provider: string
      status: string
    }
    integration: {
      payment_url: string
      webhook_url: string
      authentication: {
        client_key: string
        client_salt: string
      }
    }
    easebuzz_setup: {
      merchant_id: string
      api_key: string
      api_url: string
      configured: boolean
    }
  }
  message?: string
  error?: string
}

export default function OneToOneTestPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    apiKey: '',
    apiSalt: '',
    apiUrl: 'https://pay.easebuzz.in/payment/initiateLink'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [setupResult, setSetupResult] = useState<SetupResponse | null>(null)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "कॉपी हो गया! ✅",
        description: `${label} successfully copied करा गया`,
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "कॉपी नहीं हुआ ❌",
        description: "Clipboard access में problem है",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleSetupOneToOne = async () => {
    if (!formData.companyName || !formData.apiKey || !formData.apiSalt) {
      toast({
        title: "अधूरी जानकारी ⚠️",
        description: "Company Name, EaseBuzz Key और Salt भरना जरूरी है",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    setSetupResult(null) // Reset previous results

    try {
      // Direct call to the edge function, bypassing the incorrect apiService method
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-merchant-gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          easebuzzKey: formData.apiKey,
          easebuzzSalt: formData.apiSalt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Setup में कुछ problem आई');
      }
      
      const result = await response.json();
      
      // Adapt the edge function's response to the format this page expects
      const adaptedResult: SetupResponse = {
        success: true,
        data: {
          client: {
            id: result.merchantId,
            client_key: result.clientKey,
            client_salt: result.clientSalt,
            company_name: formData.companyName,
            status: 'active', // Assuming active status after creation
          },
          gateway: {
            id: '', // Not provided by this function, can be left empty if not critical
            name: 'EaseBuzz',
            provider: 'easebuzz',
            status: 'active',
          },
          integration: {
            payment_url: formData.apiUrl, // Use the URL from the form
            webhook_url: result.webhookUrl,
            authentication: {
              client_key: result.clientKey,
              client_salt: result.clientSalt,
            },
          },
          easebuzz_setup: {
            merchant_id: result.merchantId,
            api_key: formData.apiKey,
            api_url: formData.apiUrl,
            configured: true,
          },
        },
        message: "One-to-One mapping successfully created"
      };
      
      setSetupResult(adaptedResult);
      
      toast({
        title: "सेटअप पूरा! 🎉",
        description: "One-to-One mapping successfully created",
        duration: 5000,
      });

    } catch (error) {
      console.error('Setup error:', error)
      toast({
        title: "सेटअप में error ❌",
        description: error.message || "Backend से connection नहीं हो पा रहा",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestPayment = async () => {
    if (!setupResult?.data?.integration) {
      toast({
        title: "पहले Setup करें ⚠️",
        description: "Test करने से पहले One-to-One setup complete करें",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const testPaymentData = {
      amount: 100, // ₹1 in paisa
      order_id: `TEST_${Date.now()}`,
      customer_email: 'test@lightspeedpay.com',
      customer_name: 'Test Customer'
    }

    const credentials = {
      client_key: setupResult.data.integration.authentication.client_key,
      client_salt: setupResult.data.integration.authentication.client_salt
    }

    try {
      const result = await apiService.initiatePayment(testPaymentData, credentials)
      
      if (result.success) {
        toast({
          title: "Test Payment Ready! 🔥",
          description: "Payment URL generated successfully",
          duration: 4000,
        })
        // You could open the payment URL here
        if (result.data?.payment_url || result.data?.checkout_url) {
          window.open(result.data.payment_url || result.data.checkout_url, '_blank')
        }
      } else {
        toast({
          title: "Test Payment Failed ❌",
          description: result.error || "Payment initiation में error",
          variant: "destructive",
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Test payment error:', error)
      toast({
        title: "Payment Test Error ❌",
        description: "Test payment में technical error आई",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TestTube className="h-8 w-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          One-to-One Testing
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          EaseBuzz integration और backend testing के लिए
        </p>
      </div>

      {/* EaseBuzz Credentials Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            EaseBuzz Credentials Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Merchant's Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  type="url"
                  placeholder="https://pay.easebuzz.in/payment/initiateLink"
                  value={formData.apiUrl}
                  onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apiKey">EaseBuzz Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type="text"
                    placeholder="EaseBuzz API Key"
                    value={formData.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="apiSalt">EaseBuzz Salt</Label>
                <div className="relative">
                  <Input
                    id="apiSalt"
                    type="text"
                    placeholder="EaseBuzz API Salt"
                    value={formData.apiSalt}
                    onChange={(e) => handleInputChange('apiSalt', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LightSpeed Keys Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-500" />
            LightSpeed Keys Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSetupOneToOne}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? 'Processing...' : 'LightSpeed Keys Generate करें'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Credentials Display */}
      {setupResult?.data && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Key className="h-5 w-5" />
              Generated LightSpeed Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                  Client Key
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={setupResult.data.client.client_key}
                    readOnly
                    className="bg-white dark:bg-gray-800"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(setupResult.data!.client.client_key, 'Client Key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                  Client Salt
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={setupResult.data.client.client_salt}
                    readOnly
                    className="bg-white dark:bg-gray-800"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(setupResult.data!.client.client_salt, 'Client Salt')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                Payment URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={setupResult.data.integration.payment_url}
                  readOnly
                  className="bg-white dark:bg-gray-800"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(setupResult.data!.integration.payment_url, 'Payment URL')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                Webhook URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={setupResult.data.integration.webhook_url}
                  readOnly
                  className="bg-white dark:bg-gray-800"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(setupResult.data!.integration.webhook_url, 'Webhook URL')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                Integration Details:
              </h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                {setupResult.data.easebuzz_setup?.merchant_id && (
                    <li>• Generated Merchant ID: {setupResult.data.easebuzz_setup.merchant_id}</li>
                )}
                <li>• Client ID: {setupResult.data.client.id}</li>
                <li>• Gateway ID: {setupResult.data.gateway.id}</li>
                <li>• Company: {setupResult.data.client.company_name}</li>
                <li>• Status: {setupResult.data.client.status}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Payment Flow */}
      {setupResult?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Test Payment Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestPayment}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
            >
              ₹1 Test Payment भेजें
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Globe className="h-5 w-5" />
            उपयोग निर्देश
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-blue-700 dark:text-blue-300 space-y-2">
            <li>1. मर्चेंट का Company Name, और EaseBuzz से मिले Key और Salt डालें</li>
            <li>2. "LightSpeed Keys Generate करें" button click करें</li>
            <li>3. Generate हुए keys अपने merchant को दें</li>
            <li>4. "₹1 Test Payment भेजें" से पूरा flow test करें</li>
            <li>5. Test result में success/failure दिखेगा</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
} 