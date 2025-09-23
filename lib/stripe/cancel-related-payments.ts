
import Stripe from "stripe";
import { stripeApi as stripeApiServer } from "@/lib/stripe-server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { PaymentsTable } from "@/lib/drizzle/schema";
import { getErrorMessage } from "@/lib/utils/errors";

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
    throw new Error(`Error cancelling payments for ${gigId}: ${getErrorMessage(error)}`)
  }
};
