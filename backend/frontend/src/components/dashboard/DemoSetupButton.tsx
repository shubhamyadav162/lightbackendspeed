import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Database, Loader2, CheckCircle, XCircle, Users, CreditCard, Settings, Play, AlertCircle } from 'lucide-react';
import { apiClient } from '@/services/api';

interface DemoClient {
  id: string;
  company_name: string;
  rotation_mode: string;
  current_rotation_position: number;
  total_assigned_gateways: number;
}

interface DemoData {
  demo_data_exists: boolean;
  clients: DemoClient[];
  gateways: Array<{
    id: string;
    name: string;
    provider: string;
    success_rate: number;
    is_active: boolean;
  }>;
}

interface DemoSetupResult {
  success: boolean;
  message: string;
  data?: {
    clients: number;
    gateways: number;
    assignments: number;
    wallets: number;
  };
}

export const DemoSetupButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<DemoSetupResult | null>(null);

  // Check demo data status
  const checkDemoData = async () => {
    try {
      const response = await apiClient.get('/admin/demo');
      if (response.data.success) {
        setDemoData(response.data);
      }
    } catch (error) {
      console.error('Error checking demo data:', error);
    }
  };

  // Setup demo data
  const setupDemoData = async () => {
    setIsLoading(true);
    setSetupStatus('idle');
    setMessage('');
    setResult(null);

    try {
      const response = await fetch('/api/v1/admin/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || 'demo_admin_token'}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          data: data.data
        });
        setSetupStatus('success');
        setMessage(`✅ Demo data setup completed! Added ${data.data?.clients} clients, ${data.data?.gateways} gateways, and ${data.data?.assignments} assignments.`);
        // Refresh demo data status
        await checkDemoData();
      } else {
        setResult({
          success: false,
          message: data.error || 'Demo setup failed'
        });
        setSetupStatus('error');
        setMessage(`❌ Setup failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error occurred'
      });
      setSetupStatus('error');
      setMessage(`❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load demo data status on component mount
  React.useEffect(() => {
    checkDemoData();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Demo Data Setup
        </CardTitle>
        <CardDescription>
          Setup 5 demo clients with complete gateway rotations to test all features
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        {demoData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Demo Clients</span>
              </div>
              <Badge variant={demoData.clients.length > 0 ? "default" : "secondary"}>
                {demoData.clients.length}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Demo Gateways</span>
              </div>
              <Badge variant={demoData.gateways.length > 0 ? "default" : "secondary"}>
                {demoData.gateways.length}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge variant={demoData.demo_data_exists ? "default" : "outline"}>
                {demoData.demo_data_exists ? "Ready" : "Not Setup"}
              </Badge>
            </div>
          </div>
        )}

        {/* Demo Clients List */}
        {demoData?.demo_data_exists && demoData.clients.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Demo Clients:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {demoData.clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div>
                    <span className="text-sm font-medium">{client.company_name}</span>
                    <div className="text-xs text-gray-500">
                      {client.rotation_mode} • Position {client.current_rotation_position}/{client.total_assigned_gateways}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {client.total_assigned_gateways} गेटवेज
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <Alert className={setupStatus === 'success' ? 'border-green-200 bg-green-50' : setupStatus === 'error' ? 'border-red-200 bg-red-50' : ''}>
            <AlertDescription className="flex items-center gap-2">
              {setupStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {setupStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Demo Data Features */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Data Includes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• **5 Demo Clients** - Gaming, E-commerce, Fintech, Education, Travel companies</li>
            <li>• **5 Payment Gateways** - LightSpeed Gateway with multiple PSP backends</li>
            <li>• **Round-Robin Configurations** - Different rotation setups (3-5 gateways per client)</li>
            <li>• **Live Transaction Data** - Sample successful transactions for analytics</li>
            <li>• **Rotation Analytics** - Distribution metrics and performance data</li>
            <li>• **Commission Wallets** - Pre-populated wallet balances for testing</li>
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Demo Data Setup</h3>
            <p className="text-sm text-gray-600">
              Create demo clients and gateway assignments for testing
            </p>
          </div>
          
          <Button
            onClick={setupDemoData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isLoading ? 'Setting up...' : 'Setup Demo Data'}
          </Button>
        </div>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </AlertDescription>
            </div>
            
            {result.success && result.data && (
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-green-700">
                    ✓ {result.data.clients} Demo Clients Created
                  </div>
                  <div className="text-green-700">
                    ✓ {result.data.assignments} Gateway Assignments
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-green-700">
                    ✓ {result.data.gateways} Gateways Available
                  </div>
                  <div className="text-green-700">
                    ✓ {result.data.wallets} Commission Wallets
                  </div>
                </div>
              </div>
            )}
          </Alert>
        )}
        
        <div className="text-xs text-gray-500">
          Demo includes: Gaming World India (3 gateways) and ShopKart Online (3 gateways) with round-robin rotation
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={setupDemoData} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up demo data...
            </>
          ) : demoData?.demo_data_exists ? (
            <>
              <Database className="h-4 w-4 mr-2" />
              Refresh Demo Data
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Setup Demo Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DemoSetupButton; 