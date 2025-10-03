'use client';

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from "@/lib/stripe-client";
import { StripeElementsOptions } from '@stripe/stripe-js';

interface StripeElementsProviderProps {
  children: React.ReactNode;
  options: StripeElementsOptions;
}

const stripePromise = getStripe();

const StripeElementsProvider: React.FC<StripeElementsProviderProps> = ({ children, options }) => {
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeElementsProvider;