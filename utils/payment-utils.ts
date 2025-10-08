/**
 * Checks if the total sum of payment amounts is greater than 1
 * @param payments Array of payment objects with amount property
 * @returns true if sum > 1, false otherwise
 */
export function hasSignificantPayments(payments: { amount: number }[]): boolean {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return total >= 1;
}