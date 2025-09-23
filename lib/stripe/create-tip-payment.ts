
import type Stripe from 'stripe';
import { stripeApi as stripeApiServer } from '@/lib/stripe-server';
import { PaymentTipParams } from '@/app/actions/stripe/types';

const stripeApi: Stripe = stripeApiServer;

export async function createTipPayment(params: PaymentTipParams) {
  const {
    buyerStripeCustomerId,
    destinationAccountId,
    gigPaymentTipInfo,
    currency,
    tipAmountCents,
    description,
    savedPaymentMethodId,
    metadata
  } = params;
  const { gigId } = gigPaymentTipInfo;

  try {
    const tipIntent = await stripeApi.paymentIntents.create({
      amount: tipAmountCents,
      currency: currency || 'usd',
      customer: buyerStripeCustomerId,
      payment_method: savedPaymentMethodId,
      on_behalf_of: destinationAccountId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      description: description || '',
      transfer_data: {
        destination: destinationAccountId,
        amount: tipAmountCents,
      },
      metadata: {
        gigId: gigId,
        type: 'gig_tip',
        ...metadata,
      },
    });

    console.log(`Tip sent for worker ${destinationAccountId}. Total paid: ${tipAmountCents} cents.`);

    return tipIntent.object;
  } catch (error) {
    console.error(`Failed to pay tips for worker for gig ${gigId}:`, error);
    throw new Error('An error occurred on the server, it was not possible to send tips to worker.');
  }
}
