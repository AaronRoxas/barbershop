"use client";

import { currencyScale, maxWholePrice } from "@/lib/money";

export function PriceField({ currency, priceMinor = 0 }: { currency: string; priceMinor?: number }) {
  return <label>Price ({currency})<input name="price" type="number" inputMode="numeric"
    min={0} max={maxWholePrice(currency)} step={1} required defaultValue={priceMinor / currencyScale(currency)}
    onKeyDown={(event) => {
      if (!event.ctrlKey && !event.metaKey && !event.altKey && ["-", "+", ".", ",", "e", "E"].includes(event.key)) event.preventDefault();
    }}
    onPaste={(event) => {
      if (!/^\d+$/.test(event.clipboardData.getData("text").trim())) event.preventDefault();
    }}
    onChange={(event) => {
      // Also reject values supplied by mobile keyboards, autofill, or drag and drop.
      if (!/^\d*$/.test(event.currentTarget.value)) event.currentTarget.value = "";
    }}
  /></label>;
}
