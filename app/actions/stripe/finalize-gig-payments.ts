'use server';

import Stripe from 'stripe';
import { stripeApi as stripeApiServer } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { and, eq } from 'drizzle-orm';
import { GigsTable, PaymentsTable } from '@/lib/drizzle/schema';
import { InternalGigStatusEnumType } from '@/app/types';

const stripeApi: Stripe = stripeApiServer;

interface ProcessGigPaymentParams {
  gigId: string;
}

interface GigPaymentFields {
  id: string;
  amountGross: string;
  stripePaymentIntentId: string | null;
}

type ExpandedLatestCharge = Stripe.Charge & {
  balance_transaction: Stripe.BalanceTransaction;
};

type ExpandedPaymentIntent = Stripe.PaymentIntent & {
  latest_charge: ExpandedLatestCharge | null;
};


const findOriginalPaymentIntent = async (stripePaymentIntentId: string) => {
  const originalPaymentIntent = await stripeApi.paymentIntents.retrieve(
    stripePaymentIntentId,
    { expand: ['latest_charge.balance_transaction'] }
  );

  if (!originalPaymentIntent || originalPaymentIntent.status !== 'requires_capture') {
    throw new Error(`Payment Intent ${stripePaymentIntentId} is no in status 'requires_capture' (current: ${originalPaymentIntent?.status}).`);
  }

  return originalPaymentIntent as ExpandedPaymentIntent;
};

async function getPendingPaymentsForGig(gigId: string) {
  const gigPayments = await db.query.PaymentsTable.findMany({
    where: and(eq(PaymentsTable.gigId, gigId), eq(PaymentsTable.status, 'PENDING')),
    columns: {
      id: true,
      amountGross: true,
      stripePaymentIntentId: true,
    },
  });

  return gigPayments;
}

async function markPaymentAsCompleted(paymentId: string, chargeId: string) {
  return await db.update(PaymentsTable).set({
    paidAt: new Date(),
    status: 'COMPLETED',
    stripeChargeId: chargeId,
  })
    .where(eq(PaymentsTable.id, paymentId))
    .returning();
}

async function updateGigStatus(gigId: string, status: InternalGigStatusEnumType) {
  return await db.update(GigsTable).set({
    statusInternal: status,
  })
    .where(eq(GigsTable.id, gigId))
    .returning();
}

async function colletPendingPayments(gigPayments: GigPaymentFields[], finalPrice: number, ableFeePercent: number) {

  let amountToCollect = finalPrice;

  for (const payment of gigPayments) {
    if (amountToCollect <= 0) {
      return;
    }

    const paymentIntentId = payment.stripePaymentIntentId as string;
    const originalPaymentIntent = await findOriginalPaymentIntent(paymentIntentId);
    const paymentAmountGross = Number(payment.amountGross);
    const amountToCapture = Math.min(amountToCollect, paymentAmountGross);
    const ableFee = Math.round(amountToCapture * (ableFeePercent || 0.065));

    const captureResult = await stripeApi.paymentIntents.capture(
      originalPaymentIntent.id,
      {
        amount_to_capture: amountToCapture,
        application_fee_amount: ableFee,
      }
    );

    if (captureResult.status !== 'succeeded') {
      throw new Error(`Failed to capture PaymentIntent ${paymentIntentId}: ${captureResult.status}`);
    }

    await markPaymentAsCompleted(payment.id, captureResult.latest_charge as string);
    console.log(`Captured ${amountToCapture} cents from PaymentIntent ${paymentIntentId}.`);

    amountToCollect -= amountToCapture;
  }
}

export async function processGigPayment(params: ProcessGigPaymentParams) {
  const { gigId } = params;

  try {

    const gigDetails = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
    });

    if (!gigDetails) return;

    const finalPrice = Number(gigDetails.finalAgreedPrice);
    const ableFeePercent = Number(gigDetails.ableFeePercent);

    const allGigPayments = await getPendingPaymentsForGig(gigId);

    if (allGigPayments.length === 0) {
      throw new Error('No payments found for this gig.');
    }

    await colletPendingPayments(allGigPayments, finalPrice, ableFeePercent);
    await updateGigStatus(gigId, 'PAID');
    console.log(`All payments finalized for gig ${gigId}. Total captured: ${finalPrice} cents.`);

  } catch (error) {
    console.error(`Failed to finalize payment for gig ${gigId}:`, error);
    throw error;
  }
}