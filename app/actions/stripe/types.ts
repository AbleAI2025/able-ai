import Stripe from "stripe";

export interface DirectPaymentParams {
  currency: string;
  buyerStripeCustomerId: string;
  customerPaymentMethodId: string;
  destinationAccountId: string;
  serviceAmountInCents: number;
  ableFeePercent: number;
  description: string;
  metadata?: Record<string, string | number>;
  gigPaymentInfo: {
    gigId: string;
    payerUserId: string;
    receiverUserId: string;
  };
}

export interface PaymentTipParams {
  buyerStripeCustomerId: string;
  destinationAccountId: string;
  gigPaymentTipInfo: {
    gigId: string;
  };
  tipAmountCents: number;
  currency?: string;
  description?: string;
  savedPaymentMethodId: string;
  metadata?: Record<string, string | number>
}

export interface GigPendingPaymentFields {
  id: string;
  amountGross: string;
  stripePaymentIntentId: string | null;
}

export interface ProcessGigPaymentParams {
  gigId: string;
  currency?: string;
}

export type ExpandedLatestCharge = Stripe.Charge & {
  balance_transaction: Stripe.BalanceTransaction;
};

export type ExpandedPaymentIntent = Stripe.PaymentIntent & {
  latest_charge: ExpandedLatestCharge | null;
};

export interface DetailedStripeStatus {
  buyerConnected: boolean;
  canPay: boolean;
  workerConnected: boolean;
  canEarn: boolean;
}
