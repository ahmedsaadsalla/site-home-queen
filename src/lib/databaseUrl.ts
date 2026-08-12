/**
 * Conexão Postgres para Prisma/Hostinger.
 * Senha com "#" não pode ir só na URI — o Hostinger corta o restante.
 */
function stripEnv(value: string | undefined) {
  return (value || "").trim().replace(/^["']+|["']+$/g, "");
}

function decodePassword(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export type PgConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: { rejectUnauthorized: boolean };
};

export function getPgConfig(): PgConfig | null {
  const base = stripEnv(process.env.DATABASE_URL);
  if (!base) return null;

  let host = "";
  let port = 5432;
  let user = "postgres";
  let password = "";
  let database = "postgres";

  try {
    const parsed = new URL(base.replace(/^postgresql:/i, "http:"));
    host = parsed.hostname;
    port = Number(parsed.port || "5432");
    user = decodeURIComponent(parsed.username || "postgres");
    password = decodeURIComponent(parsed.password || "");
    database = (parsed.pathname || "/postgres").replace(/^\//, "") || "postgres";
  } catch {
    return null;
  }

  const fromEnv = decodePassword(stripEnv(process.env.DATABASE_PASSWORD));
  if (fromEnv) password = fromEnv;

  host = host.replace(
    "aws-0-us-west-2.pooler.supabase.com",
    "aws-1-us-west-2.pooler.supabase.com",
  );
  if (port === 6543) port = 5432;

  if (!host || !password) return null;
  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
  };
}

export function getDatabaseUrl(): string {
  const cfg = getPgConfig();
  if (!cfg) return stripEnv(process.env.DATABASE_URL);
  const pass = encodeURIComponent(cfg.password);
  const user = encodeURIComponent(cfg.user);
  return `postgresql://${user}:${pass}@${cfg.host}:${cfg.port}/${cfg.database}?sslmode=require`;
}

export function getDatabaseHostInfo() {
  const cfg = getPgConfig();
  if (!cfg) return { host: "", port: "", user: "" };
  return { host: cfg.host, port: String(cfg.port), user: cfg.user };
}
