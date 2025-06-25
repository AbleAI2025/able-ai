'use server';

import { eq } from 'drizzle-orm';
import { stripeApi } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";


export async function createPortalSession(firebaseUid: string) {
  try {
    if (!firebaseUid) {
      return { error: 'User ID is required.', status: 400 }
    }

    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      columns: {
        stripeConnectAccountId: true,
      }
    });
    

    if (!userRecord) throw new Error('User not found');

    if (!userRecord.stripeConnectAccountId) {
      return { error: 'Stripe Connected Account ID not found for this user. Please connect your bank account first.', status: 404 };
    }

    const loginLink = await stripeApi.accounts.createLoginLink(
      userRecord.stripeConnectAccountId
    );

    return { url: loginLink.url, status: 200 }

  } catch (error: any) {
    console.error('Error creating Stripe Account Link:', error);
    return { error: error.message, status: 500 }
  }
}