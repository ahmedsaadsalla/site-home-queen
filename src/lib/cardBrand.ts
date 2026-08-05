export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "elo"
  | "hipercard"
  | "unknown";

export function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, "");
  if (!n) return "unknown";

  if (/^3[47]/.test(n)) return "amex";
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "mastercard";
  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|651|652)/.test(
      n,
    )
  ) {
    return "elo";
  }
  if (/^(606282|3841)/.test(n)) return "hipercard";

  return "unknown";
}

export function cardBrandLabel(brand: CardBrand) {
  switch (brand) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "American Express";
    case "elo":
      return "Elo";
    case "hipercard":
      return "Hipercard";
    default:
      return "Cartão";
  }
}
