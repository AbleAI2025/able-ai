import { eq } from 'drizzle-orm';
import { db } from "@/lib/drizzle/db";
import { GigsTable, UsersTable } from "@/lib/drizzle/schema";

export interface DiscountInfo {
  code: string;
  discount_amount: string;
  discount_percentage: string;
  type: string;
}

const DISCOUNTS: Record<string, DiscountInfo> = {
  '1ABLE_FIXED': {
    code: '1',
    discount_amount: '45.99',
    discount_percentage: '',
    type: 'FIXED',
  },
  '2ABLE_PERCENTAGE': {
    code: '2',
    discount_amount: '',
    discount_percentage: '15',
    type: 'PERCENTAGE',
  }
};

const discountDefault = {
  code: '',
  discount_amount: '',
  discount_percentage: '',
  type: '',
}

export async function getAppliedDiscountCodeForGigPayment(discountCodeId: string) {

  return DISCOUNTS[discountCodeId] || discountDefault;
}
