'use server';

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from 'drizzle-orm';

export async function getUserPaymentStatus(firebaseUserid: string) {
  if (!firebaseUserid) {
    return { error: 'User Account ID is required.', status: 400 };
  }

  try {
    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUserid),
      columns: {
        id: true,
        stripeCustomerId: true,
      }
    });

    if (!userRecord) return { error: 'user not found', status: 404 };

    return {
      stripeCustomerId: userRecord.stripeCustomerId || null,
    }

  } catch (error: any) {
    console.error('Error fetching Stripe account status:', error);
    return { error: error.message || 'Failed to retrieve payments stripe status.', status: 500 };
  }
}
