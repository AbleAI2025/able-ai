
import Stripe from "stripe";
import { stripeApi as stripeApiServer } from "@/lib/stripe-server";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { GigsTable, PaymentsTable } from "@/lib/drizzle/schema";

const stripeApi: Stripe = stripeApiServer;

export async function cancelRelatedPayments(gigId: string) {
  try {
    const payments = await db.query.PaymentsTable.findMany({
      where: eq(GigsTable.id, gigId),
      columns: {
        id: true,
        stripePaymentIntentId: true,
      }
    });

    if (payments.length < 0) throw new Error(`There is not registered payments for this gig ${gigId}`);

    payments.forEach(async (payment) => {
      await stripeApi.paymentIntents.cancel(payment.stripePaymentIntentId || '');
    });

    await db
      .update(PaymentsTable)
      .set({
        status: 'REFUNDED',
      })
      .where(inArray(PaymentsTable.id, payments.map(payment => payment.id)));

  } catch (error: any) {
    throw new Error(`Error cancelling payments for ${gigId}: ${error.message}`)
  }
};
