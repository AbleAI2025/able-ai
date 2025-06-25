import { NextResponse } from 'next/server';
import { default as stripe, default as Stripe } from "stripe";
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const body = await req.text();
  const stripeSignature = req.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SIGNING_SECRET) {
    return new Response("Missing stripe webhook signing secret", {
      status: 500,
    });
  }

  const webhookSigningSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET!;

  if (!stripeSignature) {
    return new Response("Missing stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature,
      webhookSigningSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      {
        status: 400,
      },
    );
  }

  switch (event.type) {
    case "account.updated":
      const account = event.data.object as Stripe.Account;
      const userId = account.metadata?.userId;

      if (!userId) {
        console.warn("Account updated event received without userId in metadata.");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const parsedUserId = userId;
      const transfersActive = account.capabilities?.transfers === 'active';
      const payoutsEnabled = account.payouts_enabled;

      try {
        await db.update(UsersTable)
          .set({
            updatedAt: new Date(),
            canReceivePayouts: payoutsEnabled,
            stripeAccountStatus: transfersActive && payoutsEnabled? 'connected': 'incomplete',
          })
          .where(eq(UsersTable.id, parsedUserId));

      } catch (updateError: any) {
        console.error(`Error updating user ${parsedUserId} Stripe account status with Drizzle:`, updateError);
      }
      return NextResponse.json({ received: true }, { status: 200 });

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true }, { status: 200 });
  }
}
