import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { useTransactions, useAnalytics, useQueueStats } from '../../hooks/useApi';

export const TransactionMetrics = () => {
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: queueStats, isLoading: queueLoading } = useQueueStats();

  const isLoading = transactionsLoading || analyticsLoading || queueLoading;

  // Calculate metrics from real data
  const getMetrics = () => {
    if (!transactions || !analytics) {
      return [
        { label: 'Live Transactions', value: '0', change: '0%', trend: 'up', icon: CreditCard, color: 'blue' },
        { label: 'Today\'s Volume', value: '$0', change: '0%', trend: 'up', icon: DollarSign, color: 'green' },
        { label: 'Success Rate', value: '0%', change: '0%', trend: 'up', icon: TrendingUp, color: 'emerald' },
        { label: 'Failed Transactions', value: '0', change: '0%', trend: 'down', icon: TrendingDown, color: 'red' },
      ];
    }

    // Calculate total transactions
    const totalTransactions = transactions.length || 0;
    
    // Calculate today's volume
    const todayVolume = analytics.today_volume || 0;
    const formattedVolume = `$${(todayVolume / 100).toLocaleString()}`;
    
    // Calculate success rate
    const successfulTransactions = transactions.filter((t: any) => t.status === 'success' || t.status === 'completed').length;
    const successRate = totalTransactions > 0 ? ((successfulTransactions / totalTransactions) * 100).toFixed(1) : '0';
    
    // Calculate failed transactions
    const failedTransactions = transactions.filter((t: any) => t.status === 'failed' || t.status === 'error').length;
    
    // Get change percentages from analytics if available
    const volumeChange = analytics.volume_change || '+0%';
    const successRateChange = analytics.success_rate_change || '+0%';
    const failedChange = analytics.failed_change || '+0%';
    const transactionChange = analytics.transaction_change || '+0%';

    return [
      {
        label: 'Live Transactions',
        value: totalTransactions.toLocaleString(),
        change: transactionChange,
        trend: transactionChange.startsWith('+') ? 'up' : 'down',
        icon: CreditCard,
        color: 'blue'
      },
      {
        label: 'Today\'s Volume',
        value: formattedVolume,
        change: volumeChange,
        trend: volumeChange.startsWith('+') ? 'up' : 'down',
        icon: DollarSign,
        color: 'green'
      },
      {
        label: 'Success Rate',
        value: `${successRate}%`,
        change: successRateChange,
        trend: successRateChange.startsWith('+') ? 'up' : 'down',
        icon: TrendingUp,
        color: 'emerald'
      },
      {
        label: 'Failed Transactions',
        value: failedTransactions.toString(),
        change: failedChange,
        trend: 'down', // Failed transactions trending down is good
        icon: TrendingDown,
        color: 'red'
      },
    ];
  };

  const metrics = getMetrics();

  // Calculate processing queue count
  const getProcessingCount = () => {
    if (!queueStats) return 0;
    return queueStats.reduce((total: number, queue: any) => total + (queue.active || 0), 0);
  };

  const processingCount = getProcessingCount();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Metrics</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Metrics</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === 'up';
          
          return (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 text-${metric.color}-600`} />
                <div className={`flex items-center text-xs ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {metric.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </div>
          );
        })}
      </div>

      {/* Live Counter */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-700 font-medium">Processing Now</div>
            <div className="text-3xl font-bold text-blue-900">
              {queueLoading ? (
                <Loader2 className="w-8 h-8 animate-spin inline" />
              ) : (
                <span className={processingCount > 0 ? 'animate-pulse' : ''}>{processingCount}</span>
              )}
            </div>
            <div className="text-sm text-blue-600">transactions in queue</div>
          </div>
          <div className={`w-16 h-16 border-4 border-blue-300 rounded-full ${
            processingCount > 0 ? 'border-t-blue-600 animate-spin' : 'border-t-blue-400'
          }`}></div>
        </div>
      </div>
    </div>
  );
};
