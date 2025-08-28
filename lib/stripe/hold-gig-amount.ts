import { stripeApi } from '@/lib/stripe-server';
import type Stripe from 'stripe';
import { db } from "@/lib/drizzle/db";
import { PaymentsTable } from "@/lib/drizzle/schema";

interface HoldGigAmountParams {
  buyerStripeCustomerId: string;
  destinationAccountId: string;
  gigPaymentInfo: {
    gigId: string;
    payerUserId: string;
    receiverUserId: string;
  };
  serviceAmountInCents: number;
  currency?: string;
  description?: string;
  internalNotes?: string;
  metadata?: Record<string, string | number>
}

export async function holdGigAmount(params: HoldGigAmountParams) {
  const {
    buyerStripeCustomerId,
    destinationAccountId,
    gigPaymentInfo,
    currency,
    serviceAmountInCents,
    internalNotes,
    description,
    metadata
  } = params;
  const { gigId, payerUserId, receiverUserId } = gigPaymentInfo;

  const setupIntents: Stripe.SetupIntent[] = (await stripeApi.setupIntents.list()).data as Stripe.SetupIntent[];
  const userSetupIntent: Stripe.SetupIntent | undefined = setupIntents.find(
    (intent: Stripe.SetupIntent) => intent.customer === buyerStripeCustomerId && intent.payment_method != null && intent.status === 'succeeded'
  );
  const customerPaymentMethodId = userSetupIntent?.payment_method as string;

  const paymentIntent = await stripeApi.paymentIntents.create({
    amount: Math.round(serviceAmountInCents),
    currency: currency || 'usd',
    customer: buyerStripeCustomerId,
    payment_method: customerPaymentMethodId,
    on_behalf_of: destinationAccountId,
    application_fee_amount: Math.round(serviceAmountInCents * 0.065),
    payment_method_options: {
      card: {
        capture_method: 'manual',
      },
    },
    capture_method: 'manual',
    confirm: true,
    off_session: true,
    metadata: {
      gigId: gigId,
      type: 'initial_gig_hold',
      ...metadata,
    },
    description: description || `Initial hold for Gig: ${gigId}`,
    transfer_data: {
      destination: destinationAccountId,
    },
  });

  console.log(`Payment Intent created (HOLD) for Gig ${gigId}: ${paymentIntent.id}, status: ${paymentIntent.status}`);

  const appFeeAmount = paymentIntent.application_fee_amount?.toString(10) || '';
  const amountToWorker = paymentIntent.transfer_data?.amount ? paymentIntent.transfer_data?.amount :
    paymentIntent.amount - (paymentIntent?.application_fee_amount || 0);

  await db
    .insert(PaymentsTable)
    .values({
      gigId,
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge as string,
      payerUserId,
      receiverUserId,
      internalNotes,
      amountGross: serviceAmountInCents.toString(),
      ableFeeAmount: appFeeAmount.toString(),
      amountNetToWorker: amountToWorker.toString(),
      stripeFeeAmount: '0',
      status: 'PENDING',
    });

  return paymentIntent.object;
}
