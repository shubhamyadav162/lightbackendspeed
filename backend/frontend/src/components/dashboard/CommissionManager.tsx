import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  IndianRupee, 
  TrendingUp, 
  AlertTriangle, 
  Send, 
  Calculator, 
  CreditCard,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface CommissionData {
  fee_percent: number;
  balance_due: number;
  warn_threshold: number;
  commission_earned: number;
  last_payout?: string;
  last_payout_amount?: number;
  total_volume: number;
}

interface CommissionManagerProps {
  clientId: string;
  commissionData: CommissionData;
  onSendWhatsApp: (type: string, message?: string) => void;
}

export const CommissionManager: React.FC<CommissionManagerProps> = ({
  clientId,
  commissionData,
  onSendWhatsApp
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const calculateCommissionPercentage = () => {
    return ((commissionData.balance_due / commissionData.warn_threshold) * 100);
  };

  const isLowBalance = commissionData.balance_due >= commissionData.warn_threshold;
  const commissionPercentage = Math.min(calculateCommissionPercentage(), 100);

  const handleSendLowBalanceAlert = async () => {
    try {
      await onSendWhatsApp('LOW_BALANCE', 
        `Hello! Your commission balance is ₹${formatCurrency(commissionData.balance_due)}. Please clear your dues to avoid service suspension. Thank you! - LightSpeedPay`
      );
      toast.success('Low balance alert sent via WhatsApp!');
    } catch (error) {
      toast.error('Failed to send WhatsApp alert');
    }
  };

  const handleSendPaymentReminder = async () => {
    const message = customMessage || 
      `Reminder: You have a pending commission balance of ₹${formatCurrency(commissionData.balance_due)}. Please clear your dues at your earliest convenience. - LightSpeedPay`;
    
    try {
      await onSendWhatsApp('PAYMENT_REMINDER', message);
      toast.success('Payment reminder sent via WhatsApp!');
      setCustomMessage('');
    } catch (error) {
      toast.error('Failed to send payment reminder');
    }
  };

  const handleProcessPayout = async () => {
    setIsProcessingPayout(true);
    try {
      // Mock payout processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Payout processed successfully!');
    } catch (error) {
      toast.error('Failed to process payout');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Mock commission history data
  const commissionHistory = [
    { date: '2024-06-10', amount: 2500, type: 'COMMISSION', transaction_id: 'TXN_001' },
    { date: '2024-06-09', amount: 1800, type: 'COMMISSION', transaction_id: 'TXN_002' },
    { date: '2024-06-08', amount: -45000, type: 'COMMISSION_PAYOUT', transaction_id: null },
    { date: '2024-06-07', amount: 3200, type: 'COMMISSION', transaction_id: 'TXN_003' },
    { date: '2024-06-06', amount: 1500, type: 'COMMISSION', transaction_id: 'TXN_004' },
  ];

  return (
    <div className="space-y-6">
      {/* Commission Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Balance Card */}
        <Card className={`border-2 ${isLowBalance ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className={`w-5 h-5 ${isLowBalance ? 'text-red-600' : 'text-orange-600'}`} />
              <span>Balance Due to LightSpeedPay</span>
              {isLowBalance && <Badge variant="destructive">Action Required</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className={`text-3xl font-bold ${isLowBalance ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatCurrency(commissionData.balance_due)}
                </p>
                <p className="text-sm text-gray-600">
                  Threshold: {formatCurrency(commissionData.warn_threshold)}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Balance vs Threshold</span>
                  <span>{commissionPercentage.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={commissionPercentage} 
                  className={`h-3 ${isLowBalance ? 'bg-red-100' : 'bg-orange-100'}`}
                />
              </div>

              {isLowBalance && (
                <div className="p-3 bg-red-100 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-800">
                      Balance exceeded threshold! Service may be suspended.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commission Rate & Earnings */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <span>Commission Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="text-2xl font-bold text-green-600">{commissionData.fee_percent}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(commissionData.commission_earned)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Calculation Example:</p>
                <div className="p-3 bg-white rounded border text-sm">
                  <p>Transaction: ₹1,00,000</p>
                  <p>Commission: ₹1,00,000 × {commissionData.fee_percent}% = <strong>₹{((100000 * commissionData.fee_percent) / 100).toLocaleString()}</strong></p>
                </div>
              </div>

              {commissionData.last_payout && (
                <div className="p-3 bg-gray-100 rounded border">
                  <p className="text-sm text-gray-600">Last Payout</p>
                  <p className="font-medium">{formatCurrency(commissionData.last_payout_amount || 0)}</p>
                  <p className="text-xs text-gray-500">{commissionData.last_payout}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp & Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>WhatsApp Notifications & Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WhatsApp Actions */}
            <div className="space-y-4">
              <h4 className="font-medium">Send WhatsApp Messages</h4>
              
              <div className="space-y-3">
                <Button
                  onClick={handleSendLowBalanceAlert}
                  disabled={!isLowBalance}
                  className="w-full"
                  variant={isLowBalance ? "destructive" : "outline"}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Low Balance Alert
                  {!isLowBalance && <span className="ml-2 text-xs">(Not required)</span>}
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="custom-message">Custom Payment Reminder</Label>
                  <Input
                    id="custom-message"
                    placeholder="Enter custom message (optional)"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                  <Button
                    onClick={handleSendPaymentReminder}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Payment Reminder
                  </Button>
                </div>
              </div>
            </div>

            {/* Payout Actions */}
            <div className="space-y-4">
              <h4 className="font-medium">Payout Management</h4>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded border">
                  <p className="text-sm text-blue-800">
                    <strong>Current Balance:</strong> {formatCurrency(commissionData.balance_due)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Will be collected when threshold is reached
                  </p>
                </div>

                <Button
                  onClick={handleProcessPayout}
                  disabled={isProcessingPayout || commissionData.balance_due < 1000}
                  className="w-full"
                  variant="outline"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isProcessingPayout ? 'Processing...' : 'Process Manual Payout'}
                </Button>

                <p className="text-xs text-gray-500">
                  Minimum payout amount: ₹1,000
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span>Commission History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionHistory.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>
                    <Badge variant={entry.type === 'COMMISSION' ? 'default' : 'secondary'}>
                      {entry.type === 'COMMISSION' ? 'Commission' : 'Payout'}
                    </Badge>
                  </TableCell>
                  <TableCell className={entry.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                    {entry.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(entry.amount))}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.transaction_id || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}; 