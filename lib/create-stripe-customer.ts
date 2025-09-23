import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { stripeApi } from './stripe-server';

interface CreateStripeCustomerParams {
  userId: string;
  email?: string;
  name?: string;
}

export async function createStripeCustomer(params: CreateStripeCustomerParams): Promise<Stripe.Customer> {
  const { userId, email, name } = params;

  const existingUser = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.id, userId),
    columns: {
      stripeCustomerId: true,
      email: true,
      fullName: true,
    },
  });

  if (existingUser?.stripeCustomerId) {
    console.log(`Stripe Customer already exists for User ID ${userId}: ${existingUser.stripeCustomerId}`);
    return stripeApi.customers.retrieve(existingUser.stripeCustomerId) as Promise<Stripe.Customer>;
  }

  try {
    const customer = await stripeApi.customers.create({
      email: email || existingUser?.email,
      name: name || existingUser?.fullName,
      metadata: {
        yourInternalUserId: userId,
      },
      description: `Customer for internal User ID: ${userId}`,
    });

    console.log(`Stripe Customer created for user ${userId}: ${customer.id}`);

    await db.update(UsersTable)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(UsersTable.id, userId));
    console.log(`Stripe Customer ID ${customer.id} save in db for User ID: ${userId}`);

    return customer;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error creating Stripe Customer for User ID ${userId}:`, errorMessage);
    throw new Error(`Failed to create Stripe customer: ${errorMessage}`);
  }
}
