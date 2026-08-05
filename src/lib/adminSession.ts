/**
 * Constantes e sessão assinado (Edge + Node).
 * Nunca expõe senhas.
 */

export const ADMIN_COOKIE = "hq_admin_session";
export const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 min sem atividade
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000; // 15 min
export const RESET_TOKEN_MS = 60 * 60 * 1000; // 1h

export type AdminRole =
  | "Administrador"
  | "Gerente"
  | "Comercial"
  | "Financeiro"
  | "Produção"
  | "Atendimento";

export type SessionPayload = {
  sid: string;
  uid: string;
  username: string;
  name: string;
  role: AdminRole;
  /** last activity epoch ms */
  a: number;
};

const SECRET = (() => {
  const fromEnv =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    // Falha explícita em runtime de assinatura se sem secret
    return "";
  }
  return "dev-only-admin-session-secret";
})();

function b64urlEncode(data: string) {
  const bytes = new TextEncoder().encode(data);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  // btoa available in edge + node
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(data: string) {
  const pad = data + "=".repeat((4 - (data.length % 4)) % 4);
  const b64 = pad.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacHex(message: string) {
  if (!SECRET) {
    throw new Error("ADMIN_SESSION_SECRET não configurado.");
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = await hmacHex(body);
  return `${body}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmacHex(body);
  if (expected.length !== sig.length) return null;
  let ok = true;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== sig[i]) ok = false;
  }
  if (!ok) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body)) as SessionPayload;
    if (!payload.sid || !payload.uid || !payload.a) return null;
    if (Date.now() - payload.a > SESSION_IDLE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function touchSessionToken(
  token: string | undefined | null,
): Promise<{ payload: SessionPayload; token: string } | null> {
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const next: SessionPayload = { ...payload, a: Date.now() };
  return { payload: next, token: await signSession(next) };
}

/** Módulos por perfil */
export const ROLE_MODULES: Record<AdminRole, string[]> = {
  Administrador: ["*"],
  Gerente: [
    "inicio",
    "site",
    "produtos",
    "categorias",
    "pedidos",
    "orcamentos",
    "clientes",
    "atacado",
    "midias",
    "usuarios",
    "seguranca",
    "relatorios",
    "logs",
  ],
  Comercial: [
    "inicio",
    "produtos",
    "pedidos",
    "orcamentos",
    "clientes",
    "atacado",
  ],
  Financeiro: ["inicio", "pedidos", "financeiro", "clientes", "relatorios"],
  Produção: ["inicio", "produtos", "pedidos", "estoque", "garantias"],
  Atendimento: ["inicio", "pedidos", "orcamentos", "clientes", "contato"],
};

export function canAccessPath(role: AdminRole, pathname: string): boolean {
  const modules = ROLE_MODULES[role] || [];
  if (modules.includes("*")) return true;
  // free for all authenticated
  if (pathname === "/admin" || pathname === "/admin/") return true;
  if (pathname.startsWith("/admin/login")) return true;

  const map: Array<[string, string]> = [
    ["/admin/site", "site"],
    ["/admin/produtos", "produtos"],
    ["/admin/categorias", "categorias"],
    ["/admin/pedidos", "pedidos"],
    ["/admin/orcamentos", "orcamentos"],
    ["/admin/clientes", "clientes"],
    ["/admin/atacado", "atacado"],
    ["/admin/midias", "midias"],
    ["/admin/usuarios", "usuarios"],
    ["/admin/seguranca", "seguranca"],
    ["/admin/financeiro", "financeiro"],
    ["/admin/estoque", "estoque"],
    ["/admin/relatorios", "relatorios"],
    ["/admin/logs", "logs"],
    ["/admin/garantias", "garantias"],
    ["/admin/contato", "contato"],
    ["/admin/fabrica", "site"],
    ["/admin/banners", "site"],
    ["/admin/seo", "site"],
    ["/admin/configuracoes", "site"],
    ["/admin/sistema", "logs"],
    ["/admin/backup", "seguranca"],
  ];

  for (const [prefix, mod] of map) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return modules.includes(mod);
    }
  }
  // default: only admin
  return role === "Administrador";
}

export function moduleFromPath(pathname: string): string {
  if (pathname.startsWith("/admin/produtos")) return "produtos";
  if (pathname.startsWith("/admin/pedidos")) return "pedidos";
  return "geral";
}
