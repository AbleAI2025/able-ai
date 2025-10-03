'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStripeStatus } from '@/app/hooks/useStripeConnectionStatus';

interface StripeConnectionGuardProps {
  children: React.ReactNode;
  userId: string;
  redirectPath?: string;
}

const StripeConnectionGuard: React.FC<StripeConnectionGuardProps> = ({
  children,
  userId,
  redirectPath = '/settings',
}) => {
  const { isConnected, isLoading } = useStripeStatus(userId);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.replace(redirectPath);
    }
  }, [isLoading, isConnected, redirectPath, router]);

  if (isLoading) {
    return 'Loading';
  }

  if (!isConnected) {
    return null;
  }

  return <>{children}</>;
};

export default StripeConnectionGuard;
