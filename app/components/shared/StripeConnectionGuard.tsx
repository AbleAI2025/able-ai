'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStripeStatus } from '@/app/hooks/useStripeConnectionStatus';
import { Loader2 } from 'lucide-react';

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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader2 className="animate-spin" size={32} /></div>;
  }

  if (!isConnected) {
    return null;
  }

  return <>{children}</>;
};

export default StripeConnectionGuard;
