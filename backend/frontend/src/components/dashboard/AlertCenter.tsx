import React from 'react';
import { AlertTriangle, Info, Clock, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAlerts } from '../../hooks/useApi';

export const AlertCenter = () => {
  const { data: alerts, isLoading, error, refetch } = useAlerts();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } catch {
      return timestamp;
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Alert Center</h2>
          <button 
            onClick={() => refetch()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </button>
        </div>
        <div className="text-center text-red-600 py-8">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to load alerts</p>
          <p className="text-sm text-gray-500 mt-1">Please check your connection</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Alert Center</h2>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading alerts...</span>
        </div>
      </div>
    );
  }

  const displayAlerts = alerts || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Alert Center</h2>
        <button 
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>
      
      {displayAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No alerts at this time</p>
          <p className="text-sm">All systems are running smoothly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayAlerts.map((alert: any) => {
            const Icon = getAlertIcon(alert.type || alert.alert_type || 'info');
            const alertType = alert.type || alert.alert_type || 'info';
            const priority = alert.priority || alert.severity || 'low';
            
            return (
              <div key={alert.id} className={`p-4 border rounded-lg ${getAlertColor(alertType)}`}>
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {alert.title || alert.message || 'System Alert'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityBadge(priority)}`}>
                          {priority}
                        </span>
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(alert.created_at || alert.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {alert.description || alert.details || alert.message || 'No additional details available'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
