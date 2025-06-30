import React, { Component, ReactNode } from 'react';
import { ErrorBoundaryFallback } from '@/components/ui/ErrorDisplay';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by GlobalErrorBoundary:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Check if this is a subscription error that we can ignore
    if (error.message?.includes('subscription.unsubscribe is not a function') ||
        error.message?.includes('reduce is not a function')) {
      console.warn('Known subscription error caught, attempting auto-recovery');
      
      // Auto-retry for known recoverable errors
      setTimeout(() => {
        if (this.state.retryCount < this.maxRetries) {
          this.resetError();
        }
      }, 1000);
    }
    
    // You can log the error to an error reporting service here
    if (process.env.NODE_ENV === 'production') {
      // Log to error tracking service
      // logErrorToService(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorBoundaryFallback 
          error={this.state.error} 
          resetError={this.resetError}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
        />
      );
    }

    return this.props.children;
  }
} 