/**
 * Variáveis de ambiente centralizadas (produção).
 * Credenciais nunca devem ir no código-fonte.
 */
function requiredInProd(name: string, value: string | undefined, fallback = "") {
  const v = (value || "").trim();
  if (process.env.NODE_ENV === "production" && !v && !fallback) {
    console.warn(`[env] ${name} não definido em produção.`);
  }
  return v || fallback;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL || "",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000",

  adminSessionSecret: requiredInProd(
    "ADMIN_SESSION_SECRET",
    process.env.ADMIN_SESSION_SECRET,
    process.env.NODE_ENV === "production" ? "" : "dev-only-admin-session-secret",
  ),
  /** Alias de segredo (compatibilidade / futuros tokens) */
  jwtSecret: process.env.JWT_SECRET || process.env.ADMIN_SESSION_SECRET || "",
  nextAuthSecret: process.env.NEXTAUTH_SECRET || "",

  /** Seed do primeiro admin (somente se banco sem usuários) */
  seedAdminUsername: process.env.SEED_ADMIN_USERNAME || "admin@homequeen",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || "admin@homequeen.com.br",
  seedAdminName: process.env.SEED_ADMIN_NAME || "Administrador",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || "",

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
  },

  bling: {
    clientId: process.env.BLING_CLIENT_ID || "",
    clientSecret: process.env.BLING_CLIENT_SECRET || "",
  },

  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",

  googleAnalyticsId:
    process.env.GOOGLE_ANALYTICS_ID || process.env.NEXT_PUBLIC_GA_ID || "",
  googleTagManager:
    process.env.GOOGLE_TAG_MANAGER || process.env.NEXT_PUBLIC_GTM_ID || "",
  googleSearchConsole: process.env.GOOGLE_SEARCH_CONSOLE || "",

  cloudinaryUrl: process.env.CLOUDINARY_URL || "",

  bcryptRounds: Math.max(12, Number(process.env.BCRYPT_ROUNDS || 12)),
};

export function getSessionSecret() {
  const s = env.adminSessionSecret || env.jwtSecret || env.nextAuthSecret;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET (ou JWT_SECRET) é obrigatório em produção.");
  }
  return s || "dev-only-admin-session-secret";
}
