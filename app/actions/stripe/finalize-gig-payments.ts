import Stripe from 'stripe';
import { stripeApi as stripeApiServer } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { eq } from 'drizzle-orm';
import { GigsTable, PaymentsTable } from '@/lib/drizzle/schema';
import { InternalGigStatusEnumType } from '@/app/types';

const stripeApi: Stripe = stripeApiServer;

interface GigPaymentFields {
  id: string;
  amountGross: string;
  stripePaymentIntentId: string | null;
}

async function getPaymentsForGig(gigId: string) {
  const gigPayments = await db.query.PaymentsTable.findMany({
    where: eq(GigsTable.id, gigId),
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
    const paymentAmountGross = Number(payment.amountGross);
    const amountToCapture = Math.min(amountToCollect, paymentAmountGross);
    const ableFee = Math.round(amountToCapture * (ableFeePercent || 0.065));
    const amountToTransferToWorker = amountToCapture - ableFee;

    const captureResult = await stripeApi.paymentIntents.capture(
      paymentIntentId,
      {
        amount_to_capture: amountToCapture,
        application_fee_amount: ableFee,
        transfer_data: {
          amount: amountToTransferToWorker,
        },
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

export async function finalizeGigPayments(gigId: string) {

  const gigDetails = await db.query.GigsTable.findFirst({
    where: eq(GigsTable.id, gigId),
  });

  if (!gigDetails) return;

  const finalPrice = Number(gigDetails.finalAgreedPrice);
  const ableFeePercent = Number(gigDetails.ableFeePercent);

  const allGigPayments = await getPaymentsForGig(gigId);

  if (allGigPayments.length === 0) {
    throw new Error('No payments found for this gig.');
  }

  try {

    await colletPendingPayments(allGigPayments, finalPrice, ableFeePercent);
    await updateGigStatus(gigId, 'PAID');
    console.log(`All payments finalized for gig ${gigId}. Total captured: ${finalPrice} cents.`);

  } catch (error) {
    console.error(`Failed to finalize payment for gig ${gigId}:`, error);
    throw error;
  }
}
