'use server';

import Stripe from 'stripe';
import { and, eq } from 'drizzle-orm';
import { stripeApi } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { PaymentsTable, UsersTable } from "@/lib/drizzle/schema";
import { getPaymentAccountDetailsForGig } from '@/lib/stripe/get-payment-account-details-for-gig';

interface ProcessGigPaymentParams {
  firebaseUid: string;
  gigId: string;
  finalAmountToCaptureInCents: number;
  additionalCostInCents?: number;
  currency: string;
}

interface PaymentToAdditionalCostParams {
  gigId: string;
  buyerStripeCustomerId: string;
  destinationAccountId: string;
  buyerPaymentMethodId: string;
  additionalCostInCents?: number;
  currency: string;
}

type ExpandedLatestCharge = Stripe.Charge & {
  balance_transaction: Stripe.BalanceTransaction;
};

type ExpandedPaymentIntent = Stripe.PaymentIntent & {
  latest_charge: ExpandedLatestCharge | null;
};


const findOriginalPaymentIntent = async (gigId: string) => {
  const paymentIntent = await db.query.PaymentsTable.findFirst({
    where: eq(PaymentsTable.gigId, gigId),
  });

  if (!paymentIntent) throw new Error('Payment Intent not found');

  const originalPaymentIntent = await stripeApi.paymentIntents.retrieve(
    paymentIntent?.stripePaymentIntentId as string,
    { expand: ['latest_charge.balance_transaction'] }
  );

  if (!originalPaymentIntent || originalPaymentIntent.status !== 'requires_capture') {
    throw new Error(`Payment Intent ${paymentIntent.id} is no in status 'requires_capture' (current: ${originalPaymentIntent?.status}).`);
  }

  return originalPaymentIntent as ExpandedPaymentIntent;
};

async function updatePaymentHold(stripePaymentIntentId: string, stripeFeeAmount: number, capturedAmount: number, additionalAmount: number) {

  const totalCapturedAmount = capturedAmount + additionalAmount
  const paymentHoldUpdate = await db
    .update(PaymentsTable)
    .set({
      stripeFeeAmount: stripeFeeAmount.toString(),
      amountNetToWorker: (totalCapturedAmount * 0.935).toString(),
      amountGross: totalCapturedAmount.toString(),
      ableFeeAmount: (totalCapturedAmount * 0.065).toString(),
      paidAt: new Date(),
      status: 'COMPLETED',
    })
    .where(eq(PaymentsTable.stripePaymentIntentId, stripePaymentIntentId))
    .returning();

  return paymentHoldUpdate;
}

async function createPaymentToAdditionalCost({
  additionalCostInCents,
  destinationAccountId,
  buyerStripeCustomerId,
  buyerPaymentMethodId,
  currency = 'usd',
  gigId
}: PaymentToAdditionalCostParams
) {
  if (!additionalCostInCents || additionalCostInCents < 0) return;

  console.log(`Processing additional costs of ${additionalCostInCents} ${currency.toUpperCase()} for Gig ${gigId}...`);

  const additionalPaymentResult = await stripeApi.paymentIntents.create({
    amount: additionalCostInCents,
    currency,
    customer: buyerStripeCustomerId,
    on_behalf_of: destinationAccountId,
    payment_method: buyerPaymentMethodId,
    confirm: true,
    application_fee_amount: additionalCostInCents * 0.065,
    metadata: {
      gigId: gigId,
      type: 'gig_additional_cost',
    },
    description: `additional cost to Gig ID: ${gigId}`,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    transfer_data: {
      destination: destinationAccountId,
    },
    expand: ['latest_charge.balance_transaction']
  });

  console.log(`Additional Payment Intent create for Gig ${gigId}: ${additionalPaymentResult.id}, Status: ${additionalPaymentResult.status}`);

  return additionalPaymentResult;
}

export async function processGigPayment(params: ProcessGigPaymentParams) {
  const { firebaseUid, gigId, currency, finalAmountToCaptureInCents, additionalCostInCents } = params;

  try {
    if (!firebaseUid) {
      return { error: 'User ID is required.', status: 400 }
    }

    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (!userRecord) throw new Error('User not found');

    const { receiverAccountId } = await getPaymentAccountDetailsForGig(gigId);

    const buyerStripeCustomerId = userRecord?.stripeCustomerId;

    if (!buyerStripeCustomerId) {
      throw new Error('User is not connected with stripe');
    }

    const originalPaymentIntent = await findOriginalPaymentIntent(gigId);
    const amountToCapture = Math.min(finalAmountToCaptureInCents, originalPaymentIntent.amount);

    console.log(`Trying to capture ${amountToCapture} ${currency.toUpperCase()} from the PI ${originalPaymentIntent.id}...`);

    const captureResult = await stripeApi.paymentIntents.capture(originalPaymentIntent.id, {
      amount_to_capture: amountToCapture,
      metadata: {
        gigId: gigId,
        type: 'gig_final_capture',
      },
    });

    console.log(`Capture of the PI ${originalPaymentIntent.id} completed. Status: ${captureResult.status}`);

    const customerPaymentMethodId = originalPaymentIntent.payment_method as string;
    const additionalPaymentResult = await createPaymentToAdditionalCost({
      buyerPaymentMethodId: customerPaymentMethodId,
      additionalCostInCents,
      destinationAccountId: receiverAccountId as string,
      gigId,
      currency,
      buyerStripeCustomerId
    });

    await updatePaymentHold(
      gigId,
      Number(originalPaymentIntent?.latest_charge?.balance_transaction?.fee),
      captureResult.amount, Number(additionalPaymentResult?.amount) || 0
    );

    return { paymentCapture: captureResult?.object, additionalPayment: additionalPaymentResult?.object, status: 200 };

  } catch (error: any) {
    console.error(`Error retaining amount for Gig ${gigId}:`, error);
    return { error: error.message, status: 500 }
  }
}
