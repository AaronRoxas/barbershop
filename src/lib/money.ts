// Keep integer storage and booking snapshots while accepting normal currency amounts in forms.
export const MAX_PRICE_MINOR = 2147483647;

export function currencyScale(currency: string) {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return 10 ** digits;
}

export function maxWholePrice(currency: string) {
  return Math.floor(MAX_PRICE_MINOR / currencyScale(currency));
}
