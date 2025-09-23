'use server';

import Stripe from 'stripe';
import { stripeApi as stripeApiServer } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { and, eq } from 'drizzle-orm';
import { GigsTable, PaymentsTable } from '@/lib/drizzle/schema';
import { InternalGigStatusEnumType } from '@/app/types';

const stripeApi: Stripe = stripeApiServer;

interface DirectPaymentParams {
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

interface GigPendingPaymentFields {
  id: string;
  amountGross: string;
  stripePaymentIntentId: string | null;
}

interface ProcessGigPaymentParams {
  gigId: string;
  currency?: string;
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

async function getPendingPaymentForGig(gigId: string) {
  const gigPayment = await db.query.PaymentsTable.findFirst({
    where: and(eq(PaymentsTable.gigId, gigId), eq(PaymentsTable.status, 'PENDING')),
    columns: {
      id: true,
      amountGross: true,
      stripePaymentIntentId: true,
    },
  });

  return gigPayment;
}

async function markPaymentAsCompleted(paymentId: string, latestCharge: Stripe.Charge) {
  return await db.update(PaymentsTable).set({
    paidAt: new Date(),
    status: 'COMPLETED',
    stripeChargeId: latestCharge.id,
    invoiceUrl: latestCharge.receipt_url,
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

async function processPendingPayment(gigPayment: GigPendingPaymentFields, originalPaymentIntentId: string, finalPrice: number, ableFeePercent: number) {
  try {
    const paymentAmountGross = Number(gigPayment.amountGross);
    const amountToCapture = Math.min(finalPrice, paymentAmountGross);
    const ableFee = Math.round(amountToCapture * (ableFeePercent || 0.065));

    const captureResult = await stripeApi.paymentIntents.capture(
      originalPaymentIntentId,
      {
        amount_to_capture: amountToCapture,
        application_fee_amount: ableFee,
        expand: ['latest_charge']
      }
    );

    if (captureResult.status !== 'succeeded') {
      throw new Error(`Failed to capture PaymentIntent ${originalPaymentIntentId}: ${captureResult.status}`);
    }

    const latestCharge = captureResult.latest_charge as Stripe.Charge;

    await markPaymentAsCompleted(
      gigPayment.id,
      latestCharge
    );
    console.log(`Captured ${amountToCapture} cents from PaymentIntent ${originalPaymentIntentId}.`);
  } catch (error) {
    console.error(`Failed to finalize payment for payment ${originalPaymentIntentId}:`, error);
  }
}

async function createDirectPayment(params: DirectPaymentParams) {
  const {
    currency,
    metadata,
    description,
    serviceAmountInCents,
    destinationAccountId,
    buyerStripeCustomerId,
    customerPaymentMethodId,
    gigPaymentInfo,
  } = params;
  const { gigId, payerUserId, receiverUserId } = gigPaymentInfo;

  try {
    const newPaymentResult = await stripeApi.paymentIntents.create({
      amount: Math.round(serviceAmountInCents),
      currency,
      customer: buyerStripeCustomerId,
      on_behalf_of: destinationAccountId,
      payment_method: customerPaymentMethodId,
      confirm: true,
      application_fee_amount: Math.round(serviceAmountInCents * 0.065),
      metadata: {
        gigId: gigId,
        type: 'gig_direct_payment',
        ...metadata,
      },
      description: description || `direct payment to Gig ID: ${gigId}`,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      transfer_data: {
        destination: destinationAccountId,
      },
      expand: ['latest_charge.balance_transaction']
    });

    const appFeeAmount = newPaymentResult.application_fee_amount?.toString(10) || '';
    const amountToWorker = newPaymentResult.transfer_data?.amount ? newPaymentResult.transfer_data?.amount :
      newPaymentResult.amount - (newPaymentResult?.application_fee_amount || 0);
    const latestCharge = newPaymentResult.latest_charge as Stripe.Charge;

    await db
      .insert(PaymentsTable)
      .values({
        gigId,
        stripePaymentIntentId: newPaymentResult.id,
        payerUserId,
        receiverUserId,
        internalNotes: description,
        amountGross: serviceAmountInCents.toString(),
        ableFeeAmount: appFeeAmount.toString(),
        amountNetToWorker: amountToWorker.toString(),
        stripeFeeAmount: '0',
        stripeChargeId: latestCharge.id,
        invoiceUrl: latestCharge.receipt_url,
        status: 'COMPLETED',
        paidAt: new Date(),
      });

    return newPaymentResult.object;
  } catch (error) {
    console.error(`Failed to create direct payment for gig ${gigId}:`, error);
    throw new Error('An error occurred on the server, it was not possible to create the payment through Stripe.');
  }
}

export async function processGigPayment(params: ProcessGigPaymentParams) {
  const { gigId, currency } = params;

  try {
    const gigDetails = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
    });

    if (!gigDetails) return;

    const finalPrice = Number(gigDetails.finalAgreedPrice) * 100;
    const ableFeePercent = Number(gigDetails.ableFeePercent);
    const originalAgreedPrice = Number(gigDetails.totalAgreedPrice) * 100;
    const gigPayment = await getPendingPaymentForGig(gigId);

    if (!gigPayment) {
      throw new Error('No payments found for this gig.');
    }

    const paymentIntentId = gigPayment.stripePaymentIntentId as string;
    const originalPaymentIntent = await findOriginalPaymentIntent(paymentIntentId);

    if (finalPrice <= originalAgreedPrice) {
      const priceToPay = finalPrice === 0 ? originalAgreedPrice : finalPrice;
      await processPendingPayment(gigPayment, originalPaymentIntent.id, priceToPay, ableFeePercent);
      console.log(`Payment finalized for gig ${gigId}. Total captured: ${finalPrice} cents.`);
    }

    if (finalPrice > originalAgreedPrice) {
      const customerPaymentMethodId = originalPaymentIntent.payment_method as string;
      const customerId = originalPaymentIntent.customer as string;
      const receiverId = originalPaymentIntent.on_behalf_of as string;

      await createDirectPayment({
        currency: currency || 'usd',
        serviceAmountInCents: finalPrice,
        buyerStripeCustomerId: customerId,
        destinationAccountId: receiverId,
        customerPaymentMethodId: customerPaymentMethodId,
        description: `Direct payment to Gig ID: ${gigId}`,
        gigPaymentInfo: {
          gigId,
          payerUserId: gigDetails.buyerUserId,
          receiverUserId: gigDetails.workerUserId as string,
        }
      });

      // cancel old payment created
      await db.update(PaymentsTable).set({
        status: 'FAILED',
      }).where(eq(PaymentsTable.id, gigPayment.id,));
    }

    await updateGigStatus(gigId, 'PAID');

  } catch (error) {
    console.error(`Failed to finalize payment for gig ${gigId}:`, error);
    throw error;
  }
}