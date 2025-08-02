import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page</p>
          {this.state.error && (
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxWidth: '100%'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
