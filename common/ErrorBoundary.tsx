import React, { Component, ErrorInfo, ReactNode } from 'react';
import GothicErrorAlert from './GothicErrorAlert';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  customMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error details safely to the console or external crash reporting service
    console.error('=================== APOCALIPSIS REGISTRADO ===================');
    console.error('Excepción capturada por ErrorBoundary:', error);
    console.error('Component Stack Info:', errorInfo.componentStack);
    console.error('==============================================================');
  }

  resetErrorBoundary = (): void => {
    // Reset state to try rendering children again
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, title, customMessage } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it, otherwise render the gothic alert
      if (fallback) {
        return fallback;
      }

      return (
        <div className="w-full min-h-[60vh] flex items-center justify-center p-4">
          <GothicErrorAlert
            error={error}
            resetErrorBoundary={this.resetErrorBoundary}
            title={title}
            customMessage={customMessage}
          />
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
