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
import { calculatePaymentSplit } from '@/lib/utils/calculate-payment-split';

interface FinalAmounts {
  gross: number;
  fee: number;
  net: number;
}

interface PaymentCompletedParams {
  paymentId: string;
  stripeTransferId: string;
  latestCharge: Stripe.Charge;
  stripeFee: number;
  finalAmounts: FinalAmounts;
}

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
      gigId: true,
      amountGross: true,
      stripePaymentIntentId: true,
    },
  });

  return gigPayment;
}

async function markPaymentAsCompleted({
  paymentId,
  stripeTransferId,
  latestCharge,
  stripeFee,
  finalAmounts,

}: PaymentCompletedParams
) {
  return await db.update(PaymentsTable).set({
    paidAt: new Date(),
    status: 'COMPLETED',
    stripeChargeId: latestCharge.id,
    invoiceUrl: latestCharge.receipt_url,
    stripeTransferIdToWorker: stripeTransferId,
    amountGross: finalAmounts.gross.toString(),
    ableFeeAmount: finalAmounts.fee.toString(),
    amountNetToWorker: finalAmounts.net.toString(),
    stripeFeeAmount: stripeFee.toString(),
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

async function processPendingPayment(
  gigPayment: GigPendingPaymentFields,
  originalPaymentIntentId: string,
  finalPrice: number,
  ableFeePercent: number,
  destinationAccountId: string
) {
  try {
    const paymentAmountGross = Number(gigPayment.amountGross);
    const amountToCapture = Math.min(finalPrice, paymentAmountGross);
    const { fee: ableFee, net: amountToWorker } = calculatePaymentSplit(amountToCapture, (ableFeePercent || defaultFeePercent))

    const captureResult = await stripeApi.paymentIntents.capture(
      originalPaymentIntentId,
      {
        amount_to_capture: amountToCapture,
        expand: ['latest_charge.balance_transaction']
      }
    );

    if (captureResult.status !== 'succeeded') {
      throw new Error(`Failed to capture PaymentIntent ${originalPaymentIntentId}: ${captureResult.status}`);
    }

    const latestCharge = captureResult.latest_charge as Stripe.Charge;
    const balanceTransaction = latestCharge.balance_transaction as Stripe.BalanceTransaction ;

    const transfer = await stripeApi.transfers.create({
      amount: amountToWorker,
      currency: captureResult.currency,
      destination: destinationAccountId,
      source_transaction: latestCharge.id,
      transfer_group: `GIG_${gigPayment.gigId}`
    });

    const finalAmounts: FinalAmounts = {
      gross: amountToCapture,
      fee: ableFee,
      net: amountToWorker,
    };

    await markPaymentAsCompleted({
      latestCharge,
      finalAmounts,
      paymentId: gigPayment.id,
      stripeTransferId: transfer.id,
      stripeFee: balanceTransaction.fee,
    });

    console.log(`Captured ${amountToCapture} cents from PaymentIntent ${originalPaymentIntentId}.`);
    console.log(`Transferred ${amountToWorker} cents to connected account ${destinationAccountId}.`);

    return {
      captured: true,
      transferId: transfer.id,
      ableFee,
      amountToWorker
    };

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

  const amountToCapture = Math.round(serviceAmountInCents);
  const { fee: ableFee, net: amountToWorker } = calculatePaymentSplit(amountToCapture, (ableFeePercent || defaultFeePercent))

  try {
    const newPaymentResult = await stripeApi.paymentIntents.create({
      amount: amountToCapture,
      currency,
      customer: buyerStripeCustomerId,
      payment_method: customerPaymentMethodId,
      confirm: true,
      metadata: {
        gigId: gigId,
        type: 'gig_direct_payment',
        ...metadata,
      },
      description: description || `direct payment in Gig ID: ${gigId} - to user account: ${destinationAccountId}`,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      expand: ['latest_charge.balance_transaction']
    });

    const latestCharge = newPaymentResult.latest_charge as Stripe.Charge;
    const transfer = await stripeApi.transfers.create({
      amount: amountToWorker,
      currency,
      destination: destinationAccountId,
      source_transaction: latestCharge.id,
      transfer_group: `GIG_${gigId}`
    });

    await db
      .insert(PaymentsTable)
      .values({
        gigId,
        stripePaymentIntentId: newPaymentResult.id,
        payerUserId,
        receiverUserId,
        internalNotes: description,
        amountGross: serviceAmountInCents.toString(),
        ableFeeAmount: ableFee.toString(),
        amountNetToWorker: amountToWorker.toString(),
        stripeFeeAmount: '0',
        stripeChargeId: latestCharge.id,
        invoiceUrl: latestCharge.receipt_url,
        stripeTransferIdToWorker: transfer.id,
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
      await processPendingPayment(gigPayment, originalPaymentIntent.id, priceToPayWithDiscount, ableFeePercent, receiverAccountId);
      console.log(`Payment finalized for gig ${gigId}. Total captured: ${priceToPayWithDiscount} cents.`);
    }
    else if (finalPrice > originalAgreedPrice) {
      const priceToPayWithDiscount = calculateAmountWithDiscount(finalPrice, discount);

      await createDirectPayment({
        currency: currency || 'gbp',
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
        currency: currency || 'gbp',
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