/** Payload PIX demonstrativo (copia e cola) para o checkout. */
export function buildDemoPixCode(orderId: string, amount: number) {
  const value = amount.toFixed(2);
  const txid = orderId.replace(/[^A-Z0-9]/gi, "").slice(0, 25) || "HOMEQUEEN";
  // Formato inspirado no BR Code — demonstrativo (sem CRC bancário real).
  return [
    "00020126",
    "580014BR.GOV.BCB.PIX",
    `0136${txid.padEnd(36, "0").slice(0, 36)}`,
    "520400005303986",
    `54${String(value.length).padStart(2, "0")}${value}`,
    "5802BR",
    "5913HOME QUEEN LT",
    "6009SAO PAULO",
    "62070503***",
    "6304ABCD",
  ].join("");
}

export function pixQrImageUrl(pixCode: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(pixCode)}`;
}
