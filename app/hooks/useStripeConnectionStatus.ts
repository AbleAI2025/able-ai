import { useState, useEffect } from 'react';
import { getDetailedStripeStatus } from '../actions/stripe/get-detailed-stripe-status';
import { getLastRoleUsed } from '@/lib/last-role-used';
import { toast } from 'sonner';

interface StripeStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  canPay?: boolean;
  canEarn?: boolean;
  buyerConnected?: boolean;
  workerConnected?: boolean;
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
        // Handle null lastRoleUsed by defaulting to GIG_WORKER
        const roleToCheck = lastRoleUsed || 'GIG_WORKER';
        const response = await getDetailedStripeStatus(userId, roleToCheck);

        // Determine connection status based on role and capabilities
        let isConnected = false;
        
        if (roleToCheck === 'BUYER') {
          // For buyers, they're connected if they have a customer account
          // They don't need to be able to pay immediately (can set up payment method later)
          isConnected = response.buyerConnected;
        } else if (roleToCheck === 'GIG_WORKER') {
          // For workers, they're connected if they have a Connect account
          // They don't need to be able to earn immediately (account might need completion)
          isConnected = response.workerConnected;
        }

        setStatus({
          isConnected,
          isLoading: false,
          error: null,
          canPay: response.canPay,
          canEarn: response.canEarn,
          buyerConnected: response.buyerConnected,
          workerConnected: response.workerConnected,
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
  }, [userId, lastRoleUsed]);

  return status;
};
