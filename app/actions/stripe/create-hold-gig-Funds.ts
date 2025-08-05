'use server';

import { eq } from 'drizzle-orm';
import { stripeApi } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { PaymentsTable, UsersTable } from "@/lib/drizzle/schema";
import { getPaymentAccountDetailsForGig } from '../../../lib/stripe/get-payment-account-details-for-gig';

interface HoldGigFundsParams {
  firebaseUid: string;
  gigId: string;
  serviceAmountInCents: number;
  currency?: string;
}

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
}

async function holdGigAmount(params: HoldGigAmountParams) {
  const { buyerStripeCustomerId, destinationAccountId, gigPaymentInfo, currency, serviceAmountInCents } = params;
  const { gigId, payerUserId, receiverUserId } = gigPaymentInfo;

  const setupIntents = (await stripeApi.setupIntents.list()).data;
  const userSetupIntent = setupIntents.find(intent => intent.customer === buyerStripeCustomerId && intent.payment_method && intent.status === 'succeeded');
  const customerPaymentMethodId = userSetupIntent?.payment_method as string;

  const paymentIntent = await stripeApi.paymentIntents.create({
    amount: serviceAmountInCents,
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
    },
    description: `Initial hold for Gig: ${gigId}`,
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
      internalNotes: `Initial hold for Gig: ${gigId}`,
      amountGross: serviceAmountInCents.toString(),
      ableFeeAmount: appFeeAmount.toString(),
      amountNetToWorker: amountToWorker.toString(),
      stripeFeeAmount: '0',
      status: 'PENDING',
    });

  return paymentIntent.object;
}

export async function holdGigFunds(params: HoldGigFundsParams) {
  const { firebaseUid, gigId, currency, serviceAmountInCents } = params;

  try {
    if (!firebaseUid) {
      return { error: 'User ID is required.', status: 400 }
    }

    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (!userRecord) throw new Error('User not found');

    const buyerStripeCustomerId = userRecord?.stripeCustomerId;

    if (!buyerStripeCustomerId) {
      throw new Error('User is not connected with stripe');
    }

    const { receiverAccountId, gig } = await getPaymentAccountDetailsForGig(gigId);

    console.log({receiverAccountId, gig,buyerStripeCustomerId })
    const paymentIntent = await holdGigAmount({
      buyerStripeCustomerId,
      destinationAccountId: receiverAccountId as string,
      currency,
      serviceAmountInCents,
      gigPaymentInfo: {
        gigId: gigId,
        payerUserId: userRecord.id,
        receiverUserId: gig?.workerUserId as string,
      },
    });

    return { data: { paymentIntent, message: 'Payment approved' }, status: 200 }

  } catch (error: any) {
    console.error(`Error retaining amount for Gig ${gigId}:`, error);
    return { error: error.message, status: 500 }
  }
}
