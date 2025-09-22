
import Stripe from "stripe";
import { stripeApi as stripeApiServer } from "@/lib/stripe-server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { PaymentsTable } from "@/lib/drizzle/schema";

const stripeApi: Stripe = stripeApiServer;

export async function cancelRelatedPayments(gigId: string) {
  try {
    const payments = await db.query.PaymentsTable.findMany({
      where: eq(PaymentsTable.gigId, gigId),
      columns: {
        id: true,
        stripePaymentIntentId: true,
      }
    });

    if (payments.length === 0) throw new Error(`There are not registered payments for this gig ${gigId}`);

    const cancellationPromises = payments
      .filter(p => p.stripePaymentIntentId)
      .map(payment => stripeApi.paymentIntents.cancel(payment.stripePaymentIntentId!));

    await Promise.all(cancellationPromises);

    await db
      .update(PaymentsTable)
      .set({
        status: 'REFUNDED',
      })
      .where(inArray(PaymentsTable.id, payments.map(payment => payment.id)));

  } catch (error: unknown) {
    const message = (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string')
      ? error.message
      : String(error);
    throw new Error(`Error cancelling payments for ${gigId}: ${message}`)
  }
};
