import React, { Component, ReactNode } from 'react';
import { ErrorBoundaryFallback } from '@/components/ui/ErrorDisplay';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by GlobalErrorBoundary:', error, errorInfo);
    
    // You can log the error to an error reporting service here
    // For example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Log to error tracking service
      // logErrorToService(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorBoundaryFallback 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
} 