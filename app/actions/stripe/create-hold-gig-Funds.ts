'use server';

import { eq } from 'drizzle-orm';
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { getPaymentAccountDetailsForGig } from '@/lib/stripe/get-payment-account-details-for-gig';
import { holdGigAmount } from '@/lib/stripe/hold-gig-amount';

interface HoldGigFundsParams {
  firebaseUid: string;
  gigId: string;
  serviceAmountInCents: number;
  currency?: string;
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
      internalNotes: `Initial hold for Gig: ${gigId}`,
    });

    return { data: { paymentIntent, message: 'Payment approved' }, status: 200 }

  } catch (error: any) {
    console.error(`Error retaining amount for Gig ${gigId}:`, error);
    return { error: error.message, status: 500 }
  }
}
