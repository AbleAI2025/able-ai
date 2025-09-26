"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable, PaymentsTable, GigsTable } from "@/lib/drizzle/schema";
import { InternalGigStatusEnumType } from "@/app/types";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

export interface WorkerEarning {
  id: string;
  gigId: string | null;
  gigType: string | null;
  workerName: string | null;
  paidAt: Date | null;
  status: InternalGigStatusEnumType | null;
  invoiceUrl: string | null;
  totalEarnings: number | null;
}

interface FilterState {
  staffType?: 'All' | string;
  dateFrom?: string;
  dateTo?: string;
  priceFrom?: string;
  priceTo?: string;
}

export async function getWorkerEarnings(buyerId: string, filters: FilterState): Promise<{
  success: boolean;
  data?: WorkerEarning[];
  error?: string;
}> {
  try {
    if (!buyerId) {
      return {
        success: false,
        error: "Buyer ID is required"
      };
    }
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, buyerId),
    });

    if (!user) {
      return {
        success: false,
        error: "Buyer not found"
      };
    }

    const { dateFrom, dateTo, priceFrom, priceTo } = filters;

    const conditions = [];

    if (dateFrom) {
      conditions.push(gte(PaymentsTable.paidAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(PaymentsTable.paidAt, new Date(dateTo)));
    }

    if (priceFrom) {
      conditions.push(gte(sql`CAST(${PaymentsTable.amountGross} AS numeric)`, Number(priceFrom)));
    }

    if (priceTo) {
      conditions.push(lte(sql`CAST(${PaymentsTable.amountGross} AS numeric)`, Number(priceTo)));
    }

    // Get worker user details
    const workerEarnings: WorkerEarning[] = await db
      .select({
        id: PaymentsTable.id,
        gigId: GigsTable.id,
        gigType: GigsTable.titleInternal,
        workerName: UsersTable.fullName,
        status: GigsTable.statusInternal,
        invoiceUrl: PaymentsTable.invoiceUrl,
        totalEarnings: sql<number>`sum(${PaymentsTable.amountNetToWorker} + coalesce(${GigsTable.tip}, 0))`.as('total_earnings'),
        paidAt: PaymentsTable.paidAt,
      })
      .from(PaymentsTable)
      .leftJoin(GigsTable, eq(PaymentsTable.gigId, GigsTable.id))
      .leftJoin(UsersTable, eq(PaymentsTable.receiverUserId, UsersTable.id))
      .where(
        and(
          eq(PaymentsTable.receiverUserId, user.id),
          eq(PaymentsTable.status, 'COMPLETED'),
          isNotNull(PaymentsTable.paidAt),
          eq(GigsTable.statusInternal, 'PAID'),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      )
      .groupBy(
        PaymentsTable.id,
        GigsTable.id,
        UsersTable.fullName,
      )
      .orderBy(desc(PaymentsTable.createdAt));

    if (!workerEarnings) {
      return {
        success: false,
        error: "Buyer payments not found"
      };
    }

    return {
      success: true,
      data: workerEarnings
    };

  } catch (error) {
    console.error('Error fetching buyer payments:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}
