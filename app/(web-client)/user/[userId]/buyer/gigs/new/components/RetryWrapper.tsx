import React, { useState, useCallback } from 'react';
import { LoadingIndicator } from './LoadingIndicator';

interface RetryWrapperProps {
  onRetry: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
  loadingMessage?: string;
  errorMessage?: string;
  children: React.ReactNode;
}

export const RetryWrapper: React.FC<RetryWrapperProps> = ({
  onRetry,
  maxRetries = 3,
  retryDelay = 1000,
  loadingMessage = 'Processing...',
  errorMessage = 'Something went wrong. Please try again.',
  children
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setError(new Error('Maximum retry attempts reached'));
      return;
    }

    setIsRetrying(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await onRetry();
      setRetryCount(0);
    } catch (err) {
      setRetryCount(prev => prev + 1);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsRetrying(false);
    }
  }, [maxRetries, onRetry, retryCount, retryDelay]);

  if (isRetrying) {
    return <LoadingIndicator message={loadingMessage} />;
  }

  if (error) {
    return (
      <div style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
      }}>
        <p>{errorMessage}</p>
        {retryCount < maxRetries && (
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
