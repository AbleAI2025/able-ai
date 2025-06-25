'use client';

import { createAccountLink } from '@/app/actions/stripe/create-account-link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import React, { useState } from 'react';
import styles from "../SettingsPage.module.css";
import onboardingRetryStyles from "./onboarding-retry.module.css";

export default function OnboardingRetryPage() {
  const {
    user,
    loading: isLoading,
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    if (isLoading || !user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await createAccountLink(user?.uid);

      if (response.error && response.status === 500) throw new Error(response.error || 'Failed to generate a new Stripe account link.');

      if (response.status === 200 && response.url)
        window.location.href = response.url;


    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${onboardingRetryStyles.onboardCard}`}>
        <header className={styles.pageHeader}>
          <h1 className="pb-2">Stripe Connection Failed or Expired</h1>
          <p>It looks like your Stripe account connection session expired or encountered an issue.</p>
          <p>Please try connecting your account again.</p>
        </header>
        <div className={onboardingRetryStyles.buttonWrapper}>
          <button
            type="submit"
            disabled={loading}
            className={styles.button}
            onClick={handleRetry}
          >
            {loading ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        <p style={{ marginTop: 'auto' }}>
          If the issue persists, please contact support.
        </p>
      </div>
    </div>
  );
}
