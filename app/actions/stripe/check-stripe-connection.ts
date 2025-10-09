'use server';

import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { getErrorMessage } from '@/lib/utils/errors';
import { stripeApi as stripeServer } from '@/lib/stripe-server';

const stripeApi: Stripe = stripeServer;

async function checkCustomerConnection(stripeCustomerId: string | null) {

  if (!stripeCustomerId) throw new Error('Stripe customer not exists');

  try {
    await stripeApi.customers.retrieve(stripeCustomerId);
    return {
      connected: true,
      message: 'Connected as stripe customer.'
    };
  } catch (error: any) {
    console.error('Error trying to recover Customer:', error.message);
    throw new Error(error.message);
  }
}

async function checkAccountConnection(stripeAccountId: string | null) {
  if (!stripeAccountId) throw new Error('Stripe Account not exists');

  try {
    const account = await stripeApi.accounts.retrieve(stripeAccountId);

    return {
      connected: Boolean(account),
      message: account.id ? 'Connected as Stripe Account.' : 'Stripe Account not activated or not enabled for payments yet.'
    };
  } catch (error: any) {
    console.error('Error trying to recover Account:', error.message);
    throw new Error(error.message);
  }
}

export async function checkStripeConnection(firebaseUid: string, userRole: "BUYER" | "GIG_WORKER" | null) {
  try {

    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      columns: {
        stripeConnectAccountId: true,
        stripeCustomerId: true,
      }
    });

    if (!userRecord) throw new Error('User not found');

    const stripeCustomerId = userRecord.stripeCustomerId;
    const stripeAccountId = userRecord.stripeConnectAccountId;


    if (userRole === 'BUYER') return await checkCustomerConnection(stripeCustomerId);
    if (userRole === 'GIG_WORKER') return await checkAccountConnection(stripeAccountId);

    throw new Error('Invalid or missing user role for Stripe connection check.');
  } catch (error: unknown) {
    console.error('Error verifying Stripe connection:', error);
    return { connected: false, error: getErrorMessage(error), status: 500 }
  }
}
