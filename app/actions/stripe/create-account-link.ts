'use server';

import { eq } from 'drizzle-orm';
import { stripeApi } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";

export async function createAccountLink(firebaseUid: string) {
  try {
    if (!firebaseUid) {
      return { error: 'User ID is required.', status: 400 }
    }

    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (!userRecord) throw new Error('User not found');

    let stripeAccountId = userRecord?.stripeConnectAccountId;

    if (!stripeAccountId) {
      const account = await stripeApi.accounts.create({
        type: 'express', // account type connected
        country: 'US', // adjust country
        email: userRecord?.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          email: userRecord?.email || undefined,
          first_name: userRecord?.fullName?.split(' ')[0],
          last_name: userRecord?.fullName?.slice(userRecord.fullName.indexOf(' ') + 1),
        },
        metadata: {
          userId: String(userRecord?.id),
        },
      });
      stripeAccountId = account.id;

      await db.update(UsersTable)
        .set({ stripeConnectAccountId: stripeAccountId })
        .where(eq(UsersTable.id, userRecord.id));

    }

    const accountLink = await stripeApi.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/${userRecord.id}/settings/onboarding-retry`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/${userRecord.id}/settings/onboarding-success?account_id=${stripeAccountId}`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url, status: 200 }

  } catch (error: any) {
    console.error('Error creating Stripe Account Link:', error);
    return { error: error.message, status: 500 }
  }
}
