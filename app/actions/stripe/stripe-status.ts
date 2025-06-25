'use server';

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from 'drizzle-orm';
import { stripeApi } from '@/lib/stripe-server';

export async function stripeStatus(accountId: string) {
  try {

    if (!accountId) {
      return { error: 'Stripe Account ID is required.', status: 400 };
    }

    const stripeAccount = await stripeApi.accounts.retrieve(accountId);
    const transfersActive = stripeAccount.capabilities?.transfers === 'active';
    const payoutsEnabled = stripeAccount.payouts_enabled;

    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.stripeConnectAccountId, accountId),
      columns: { id: true }
    });

    if (userRecord) {
      await db.update(UsersTable)
        .set({
          canReceivePayouts: payoutsEnabled,
          stripeAccountStatus: transfersActive && payoutsEnabled ? 'connected' : 'incomplete',
        })
        .where(eq(UsersTable.id, userRecord.id));

      console.log(`DB updated for user ${userRecord.id} from direct Stripe API check.`);
    } else {
      console.warn(`User with Stripe Account ID ${accountId} not found in local DB during status check.`);
    }

    return {
      accountId: accountId,
      payoutsEnabled: payoutsEnabled,
      transfersActive: transfersActive,
    };

  } catch (error: any) {
    console.error('Error fetching Stripe account status:', error);

    return { error: error.message || 'Failed to retrieve Stripe account status.', status: 500 };
  }
}