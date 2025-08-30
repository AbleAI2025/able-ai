import { DiscountInfo } from "../stripe/get-applied-discount-code-for-gig-payment";

export function calculateAmountWithDiscount(amount: number, discount: DiscountInfo) {
  if (!discount.type) return amount;

  let finalAmount = amount;

  if (discount.type === 'FIXED') {
    // Convert discount from dollars to cents before subtracting
    finalAmount = amount - (Number(discount.discount_amount) * 100);
  } else if (discount.type === 'PERCENTAGE') {
    finalAmount = amount - (amount * (Number(discount.discount_percentage) / 100));
  }

  // Ensure the final amount is not negative and is rounded to the nearest cent.
  return Math.max(0, Math.round(finalAmount));
}
