import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, ShieldAlert } from 'lucide-react';

interface ErrorDisplayProps {
  error: Error | any;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  title = 'कुछ गलत हो गया',
  className = '' 
}) => {
  const getErrorDetails = () => {
    // Network error
    if (error?.message?.toLowerCase().includes('network') || 
        error?.message?.toLowerCase().includes('fetch')) {
      return {
        icon: <WifiOff className="h-12 w-12 text-red-500" />,
        title: 'Network Connection Error',
        message: 'इंटरनेट कनेक्शन चेक करें और दोबारा कोशिश करें।',
        showRetry: true
      };
    }

    // Server error
    if (error?.status >= 500 || error?.message?.toLowerCase().includes('server')) {
      return {
        icon: <ServerCrash className="h-12 w-12 text-orange-500" />,
        title: 'Server Error',
        message: 'Server में कुछ समस्या है। कृपया कुछ समय बाद कोशिश करें।',
        showRetry: true
      };
    }

    // Authentication error
    if (error?.status === 401 || error?.status === 403) {
      return {
        icon: <ShieldAlert className="h-12 w-12 text-yellow-500" />,
        title: 'Authentication Error',
        message: 'आपकी permission इस action के लिए नहीं है।',
        showRetry: false
      };
    }

    // Default error
    return {
      icon: <AlertCircle className="h-12 w-12 text-red-500" />,
      title: title,
      message: error?.message || 'एक unexpected error हुई है। कृपया दोबारा कोशिश करें।',
      showRetry: true
    };
  };

  const { icon, title: errorTitle, message, showRetry } = getErrorDetails();

  return (
    <Card className={`${className}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {icon}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{errorTitle}</h3>
            <p className="text-sm text-muted-foreground max-w-md">{message}</p>
          </div>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              दोबारा कोशिश करें
            </Button>
          )}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left w-full max-w-md">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ 
  error, 
  resetError,
  retryCount = 0,
  maxRetries = 3
}) => {
  const isSubscriptionError = error.message?.includes('subscription.unsubscribe') || 
                             error.message?.includes('reduce is not a function');
  
  const isRetryable = retryCount < maxRetries;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Application Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm">
                {isSubscriptionError 
                  ? 'Real-time connection में समस्या है।'
                  : 'Application में एक unexpected error आई है।'
                }
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-mono">{error.message}</p>
            </div>

            {retryCount > 0 && (
              <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                Retry attempt: {retryCount}/{maxRetries}
              </div>
            )}

            <div className="flex gap-2">
              {isRetryable && (
                <Button onClick={resetError} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isSubscriptionError ? 'Reconnect करें' : 'Application Restart करें'}
                </Button>
              )}
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
              >
                Home पर जाएं
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Page Reload करें
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  Stack Trace
                </summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
