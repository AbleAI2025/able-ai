
export function calculatePaymentSplit(amount: number, feePercent: number) {
  const fee = Math.round(amount * feePercent);
  const net = amount - fee;

  return { fee, net };
}
