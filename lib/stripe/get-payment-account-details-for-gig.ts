import { eq } from 'drizzle-orm';
import { db } from "@/lib/drizzle/db";
import { GigsTable, UsersTable } from "@/lib/drizzle/schema";
import { getAppliedDiscountCodeForGigPayment } from './get-applied-discount-code-for-gig-payment';

export async function getPaymentAccountDetailsForGig(gigId: string) {
  const gigRecord = await db.query.GigsTable.findFirst({
    where: eq(GigsTable.id, gigId),
    columns: {
      buyerUserId: true,
      workerUserId: true,
      id: true,
      finalAgreedPrice: true,
      totalAgreedPrice: true,
      promoCodeApplied: true,
    }
  });

  if (!gigRecord) {
    throw new Error('Gig not found');
  }

  const receiverUserRecord = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.id, gigRecord.workerUserId as string),
    columns: {
      id: true,
      stripeConnectAccountId: true,
    }
  });

  if (!receiverUserRecord?.stripeConnectAccountId) {
    throw new Error('Receiver is not connected with stripe');
  }

  const discount = await getAppliedDiscountCodeForGigPayment(gigRecord.promoCodeApplied || '');

  return { receiverAccountId: receiverUserRecord.stripeConnectAccountId, gig: gigRecord, discount };
}
