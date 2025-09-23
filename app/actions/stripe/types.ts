import Stripe from "stripe";

export interface DirectPaymentParams {
  currency: string;
  buyerStripeCustomerId: string;
  customerPaymentMethodId: string;
  destinationAccountId: string;
  serviceAmountInCents: number;
  description: string;
  metadata?: Record<string, string | number>;
  gigPaymentInfo: {
    gigId: string;
    payerUserId: string;
    receiverUserId: string;
  };
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
