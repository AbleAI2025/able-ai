import { eq } from 'drizzle-orm';
import { db } from "@/lib/drizzle/db";
import { GigsTable, UsersTable } from "@/lib/drizzle/schema";

export async function getPaymentAccountDetailsForGig(gigId: string) {
  const gigRecord = await db.query.GigsTable.findFirst({
    where: eq(GigsTable.id, gigId),
    columns: {
      buyerUserId: true,
      workerUserId: true,
      id: true,
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

  return { receiverAccountId: receiverUserRecord.stripeConnectAccountId, gig: gigRecord };
}
