/**
 * Monta DATABASE_URL para Prisma/Postgres.
 * - Remove aspas que o Hostinger às vezes inclui
 * - Injeta DATABASE_PASSWORD em texto puro (o # na URL quebra o parse)
 * - Corrige o host do pooler aws-0 → aws-1
 * - Usa porta 5432 (session). A 6543 costuma dar timeout no Hostinger.
 */
function stripEnv(value: string | undefined) {
  return (value || "").trim().replace(/^["']+|["']+$/g, "");
}

export function getDatabaseUrl(): string {
  let base = stripEnv(process.env.DATABASE_URL);
  const plainPassword = stripEnv(process.env.DATABASE_PASSWORD);
  if (!base) return "";

  base = base.replace(
    "aws-0-us-west-2.pooler.supabase.com",
    "aws-1-us-west-2.pooler.supabase.com",
  );

  if (base.includes(":6543")) {
    base = base
      .replace(":6543", ":5432")
      .replace("pgbouncer=true&", "")
      .replace("&pgbouncer=true", "")
      .replace("?pgbouncer=true", "");
  }

  if (!plainPassword) return base;

  const encoded = encodeURIComponent(plainPassword);
  return base.replace(
    /^(postgresql:\/\/[^:/?#]+:)([^@]*)(@)/i,
    `$1${encoded}$3`,
  );
}

export function getDatabaseHostInfo() {
  const url = getDatabaseUrl();
  if (!url) return { host: "", port: "", user: "" };
  try {
    const u = new URL(url.replace(/^postgresql:/, "http:"));
    return {
      host: u.hostname,
      port: u.port,
      user: decodeURIComponent(u.username || ""),
    };
  } catch {
    const m = url.match(/@([^/:?]+):?(\d+)?/);
    return { host: m?.[1] || "", port: m?.[2] || "", user: "" };
  }
}
