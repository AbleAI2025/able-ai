'use client'; // Si usas componentes de cliente

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import styles from "../SettingsPage.module.css";
import onboardingSuccessStyles from "./onboarding-success.module.css";
import { stripeStatus } from '@/app/actions/stripe/stripe-status';

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useParams();
  const accountId = searchParams.get('account_id');
  const [statusMessage, setStatusMessage] = useState('Verifying Stripe connection...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        if (!accountId) throw new Error('Error: No Stripe account ID found in the URL.');

        const response = await stripeStatus(accountId);
        setStatusMessage('Stripe account connected successfully!');
        setLoading(false);

        const timer = setTimeout(() => {
          router.push(`/user/${userId}/settings`);
        }, 3000);

        return () => clearTimeout(timer);

      } catch (error: any) {
        setStatusMessage(error?.message);
        setLoading(false);
      }
    };

    checkStripeStatus();

  }, [accountId, router, searchParams, userId]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div>
          <header className={styles.pageHeader}>
            <h1>Stripe Onboarding</h1>
          </header>
          {loading ? (
            <p>{statusMessage}</p>
          ) : (
            <>
              <p>{statusMessage}</p>
              <p>You will be redirected shortly.</p>
              <div className={onboardingSuccessStyles.buttonWrapper}>
                <Link href={`/user/${userId}/settings`} className={`${styles.button} ${onboardingSuccessStyles.buttonLink}`}>
                  Go to Settings
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
