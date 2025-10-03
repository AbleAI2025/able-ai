import { useState, useEffect } from 'react';
import { checkStripeConnection } from '../actions/stripe/check-stripe-connection';
import { getLastRoleUsed } from '@/lib/last-role-used';

// Define la estructura de tu estado
interface StripeStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useStripeStatus = (userId: string): StripeStatus => {
  const lastRoleUsed = getLastRoleUsed();
  const [status, setStatus] = useState<StripeStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (userId.length === 0) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: 'User not logged in or userId is empty.',
      });
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await checkStripeConnection(userId, lastRoleUsed);

        setStatus({
          isConnected: Boolean(response?.connected),
          isLoading: false,
          error: null,
        });

      } catch (err) {
        console.error("Error checking Stripe status:", err);
        setStatus({
          isConnected: false,
          isLoading: false,
          error: err instanceof Error ? err.message : 'unknown error',
        });
      }
    };

    checkStatus();
  }, []);

  return status;
};
