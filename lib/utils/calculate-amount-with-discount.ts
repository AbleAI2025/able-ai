import { DiscountInfo } from "../stripe/get-applied-discount-code-for-gig-payment";

export function calculateAmountWithDiscount(amount: number, discount: DiscountInfo) {
  if (!discount) return amount;

  if (discount.type === 'FIXED') return amount - Number(discount.discount_amount);

  return amount - (amount * (Number(discount.discount_percentage) / 100));
}
