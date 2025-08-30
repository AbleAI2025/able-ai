'use server'

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/db';
import { GigsTable, PaymentsTable, UsersTable } from '@/lib/drizzle/schema';
import { getPaymentAccountDetailsForGig } from '@/lib/stripe/get-payment-account-details-for-gig';
import { holdGigAmount } from '@/lib/stripe/hold-gig-amount';
import { calculateAmountWithDiscount } from '@/lib/utils/calculate-amount-with-discount';

interface GigAdjustmentParams {
  firebaseUid: string;
  gigId: string;
  newFinalRate: number;
  newFinalHours: number;
  currency: string;
}

export async function updateAdjustedGig(
  { gigId, newFinalRate, newFinalHours }: { gigId: string, newFinalRate: number, newFinalHours: number }
) {
  try {
    const newFinalPrice = Math.round(newFinalRate * newFinalHours * 100);

    await db.update(GigsTable)
      .set({
        finalRate: newFinalRate.toString(),
        finalHours: newFinalHours.toString(),
        finalAgreedPrice: newFinalPrice.toString(),
        adjustedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(GigsTable.id, gigId));

  } catch (error) {
    throw error;
  }
}

export async function handleGigAdjustment(
  {
    firebaseUid,
    gigId,
    newFinalRate,
    newFinalHours,
    currency,
  }: GigAdjustmentParams
) {

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

    const { receiverAccountId, gig, discount } = await getPaymentAccountDetailsForGig(gigId);
    const currentFinalPrice = Number(gig.totalAgreedPrice);
    const newFinalPriceCents = Math.round(Number(newFinalRate) * Number(newFinalHours) * 100);

    if (newFinalPriceCents === currentFinalPrice) throw new Error('There have been no changes in the working hours or in the rate.');

    if (newFinalPriceCents < currentFinalPrice) {
      await updateAdjustedGig({
        gigId,
        newFinalRate: Number(newFinalRate),
        newFinalHours: Number(newFinalHours)
      });
      return;
    }

    const newTotalWithDiscount = calculateAmountWithDiscount(newFinalPriceCents, discount);
    const oldTotalWithDiscount = calculateAmountWithDiscount(currentFinalPrice, discount);
    const differenceAmountWithDiscount = newTotalWithDiscount - oldTotalWithDiscount;

    await holdGigAmount({
      buyerStripeCustomerId,
      destinationAccountId: receiverAccountId as string,
      currency,
      serviceAmountInCents: differenceAmountWithDiscount,
      description: `Adjustment for Gig ID: ${gigId}`,
      internalNotes: `Adjustment for Gig ID: ${gigId}`,
      gigPaymentInfo: {
        gigId: gigId,
        payerUserId: userRecord.id,
        receiverUserId: gig?.workerUserId as string,
      },
      metadata: {
        paymentType: 'ADJUSTMENT',
      },
    });

    await updateAdjustedGig({ gigId, newFinalRate, newFinalHours });

  } catch (error: any) {
    console.error(error);
    return { error: error.message }
  }
}
