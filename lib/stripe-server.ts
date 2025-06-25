import Stripe from "stripe";

export const stripeApi = new Stripe(process.env.STRIPE_SECRET_KEY!);
