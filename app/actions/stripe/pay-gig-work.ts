'use server';

import Stripe from 'stripe';
import { stripeApi as stripeApiServer } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { and, eq } from 'drizzle-orm';
import { GigsTable, PaymentsTable } from '@/lib/drizzle/schema';
import { InternalGigStatusEnumType } from '@/app/types';
import { DirectPaymentParams, ExpandedPaymentIntent, GigPendingPaymentFields, ProcessGigPaymentParams } from './types';
import { createTipPayment } from '@/lib/stripe/create-tip-payment';
import { getPaymentAccountDetailsForGig } from '@/lib/stripe/get-payment-account-details-for-gig';
import { calculateAmountWithDiscount } from '@/lib/utils/calculate-amount-with-discount';

const stripeApi: Stripe = stripeApiServer;

const defaultFeePercent = 0.065;

const findOriginalPaymentIntent = async (stripePaymentIntentId: string) => {
  const originalPaymentIntent = await stripeApi.paymentIntents.retrieve(
    stripePaymentIntentId,
    { expand: ['latest_charge.balance_transaction'] }
  );

  if (!originalPaymentIntent || originalPaymentIntent.status !== 'requires_capture') {
    throw new Error(`Payment Intent ${stripePaymentIntentId} is not in status 'requires_capture' (current: ${originalPaymentIntent?.status}).`);
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
    const ableFee = Math.round(amountToCapture * (ableFeePercent || defaultFeePercent));

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
    throw error;
  }
}

async function createDirectPayment(params: DirectPaymentParams) {
  const {
    currency,
    metadata,
    description,
    serviceAmountInCents,
    ableFeePercent,
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
      application_fee_amount: Math.round(serviceAmountInCents * (ableFeePercent || defaultFeePercent)),
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

    console.log(`Payment created for gig ${gigId}. Total payed: ${serviceAmountInCents} cents.`);

    return newPaymentResult.object;
  } catch (error) {
    console.error(`Failed to create direct payment for gig ${gigId}:`, error);
    throw new Error('An error occurred on the server, it was not possible to create the payment through Stripe.');
  }
}

export async function processGigPayment(params: ProcessGigPaymentParams) {
  const { gigId, currency } = params;

  try {
    const { receiverAccountId, gig: gigDetails, discount } = await getPaymentAccountDetailsForGig(gigId);
    const finalPrice = Number(gigDetails.finalAgreedPrice) * 100;
    const ableFeePercent = Number(gigDetails.ableFeePercent);
    const originalAgreedPrice = Number(gigDetails.totalAgreedPrice) * 100;
    const gigPayment = await getPendingPaymentForGig(gigId);

    if (!gigPayment) {
      throw new Error('No payments found for this gig.');
    }

    const paymentIntentId = gigPayment.stripePaymentIntentId as string;

    if (!paymentIntentId) {
      throw new Error(`Gig payment ${gigPayment.id} is missing a Stripe Payment Intent ID.`);
    }

    const originalPaymentIntent = await findOriginalPaymentIntent(paymentIntentId);
    const customerPaymentMethodId = originalPaymentIntent.payment_method;

    if (typeof customerPaymentMethodId !== 'string') {
      throw new Error(`Payment Intent ${paymentIntentId} is missing a payment method ID.`);
    }

    const customerId = originalPaymentIntent.customer;

    if (typeof customerId !== 'string') {
      throw new Error(`Payment Intent ${paymentIntentId} is missing a customer ID.`);
    }

    if (finalPrice <= originalAgreedPrice) {
      const priceToPay = finalPrice === 0 ? originalAgreedPrice : finalPrice;
      const priceToPayWithDiscount = calculateAmountWithDiscount(priceToPay, discount);
      await processPendingPayment(gigPayment, originalPaymentIntent.id, priceToPayWithDiscount, ableFeePercent);
      console.log(`Payment finalized for gig ${gigId}. Total captured: ${finalPrice} cents.`);
    }
    else if (finalPrice > originalAgreedPrice) {
      const priceToPayWithDiscount = calculateAmountWithDiscount(finalPrice, discount);

      await createDirectPayment({
        currency: currency || 'usd',
        serviceAmountInCents: priceToPayWithDiscount,
        ableFeePercent: Number(gigDetails.ableFeePercent),
        buyerStripeCustomerId: customerId,
        destinationAccountId: receiverAccountId,
        customerPaymentMethodId: customerPaymentMethodId,
        description: `Direct payment to Gig ID: ${gigId}`,
        gigPaymentInfo: {
          gigId,
          payerUserId: gigDetails.buyerUserId,
          receiverUserId: gigDetails.workerUserId as string,
        }
      });

      // cancel old payment created
      await stripeApi.paymentIntents.cancel(originalPaymentIntent.id);
      await db.update(PaymentsTable).set({
        status: 'CANCELLED',
      }).where(eq(PaymentsTable.id, gigPayment.id));
    }

    if (gigDetails.tip)
      await createTipPayment({
        currency: currency || 'usd',
        tipAmountCents: Math.round(Number(gigDetails.tip) * 100),
        buyerStripeCustomerId: customerId,
        destinationAccountId: receiverAccountId,
        savedPaymentMethodId: customerPaymentMethodId,
        description: `Tip for service provided by worker in Gig: ${gigId}`,
        gigPaymentTipInfo: {
          gigId,
        },
      });

    await updateGigStatus(gigId, 'PAID');

  } catch (error) {
    console.error(`Failed to finalize payment for gig ${gigId}:`, error);
    throw error;
  }
}