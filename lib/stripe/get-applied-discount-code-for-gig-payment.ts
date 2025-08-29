
export interface DiscountInfo {
  code: string;
  discount_amount: string;
  discount_percentage: string;
  type: 'FIXED' | 'PERCENTAGE';
}

const DISCOUNTS: Record<string, DiscountInfo> = {
  '1ABLE_FIXED': {
    code: '1',
    discount_amount: '45.99',
    discount_percentage: '0',
    type: 'FIXED',
  },
  '2ABLE_PERCENTAGE': {
    code: '2',
    discount_amount: '0',
    discount_percentage: '15',
    type: 'PERCENTAGE',
  }
};

const discountDefault = {
  code: '',
  discount_amount: '0',
  discount_percentage: '0',
  type: '',
}

export async function getAppliedDiscountCodeForGigPayment(discountCodeId: string) {

  return DISCOUNTS[discountCodeId] || discountDefault;
}
