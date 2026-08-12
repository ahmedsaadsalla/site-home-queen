/**
 * Monta DATABASE_URL com senha em texto puro (evita problemas com # na URL no Hostinger).
 * Defina DATABASE_PASSWORD no painel; a senha na URL pode ser placeholder.
 */
export function getDatabaseUrl(): string {
  const base = (process.env.DATABASE_URL || "").trim();
  const plainPassword = (process.env.DATABASE_PASSWORD || "").trim();
  if (!base) return "";
  if (!plainPassword) return base;

  try {
    const url = new URL(base);
    url.password = plainPassword;
    return url.toString();
  } catch {
    return base;
  }
}
