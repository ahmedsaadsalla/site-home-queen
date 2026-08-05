import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  canAccessPath,
  touchSessionToken,
  verifySessionToken,
  type AdminRole,
} from "@/lib/adminSession";
import { rateLimit } from "@/lib/rateLimit";

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/forgot-password",
  "/api/admin/reset-password",
];

const RATE_LIMITED = [
  "/api/admin/login",
  "/api/admin/forgot-password",
  "/api/admin/reset-password",
  "/api/cliente/login",
  "/api/cliente/forgot-password",
  "/api/cliente/reset-password",
  "/api/atacado/login",
];

const MAINTENANCE_BYPASS = [
  "/manutencao",
  "/maintenance.json",
  "/api/health",
  "/api/cron",
  "/api/analytics",
  "/_next",
  "/favicon",
];

function isPublic(pathname: string) {
  return PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Proteção CSRF simples: Origin/Referer must match host em mutações admin */
function csrfOk(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") return true;
  const host = request.headers.get("host");
  if (!host) return true;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  return true;
}

function isMaintenanceBypass(pathname: string) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return true;
  }
  return MAINTENANCE_BYPASS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p),
  );
}

async function maintenanceEnabled(request: NextRequest): Promise<boolean> {
  try {
    const url = new URL("/maintenance.json", request.url);
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { enabled?: boolean };
    return Boolean(data.enabled);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Produção: forçar HTTPS
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Modo manutenção (visitantes) — admins autenticados passam
  if (!isMaintenanceBypass(pathname)) {
    const on = await maintenanceEnabled(request);
    if (on) {
      const token = request.cookies.get(ADMIN_COOKIE)?.value;
      const session = await verifySessionToken(token);
      if (!session) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Site em manutenção." },
            { status: 503 },
          );
        }
        const dest = request.nextUrl.clone();
        dest.pathname = "/manutencao";
        dest.search = "";
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-hq-maintenance", "1");
        return NextResponse.rewrite(dest, {
          request: { headers: requestHeaders },
        });
      }
    }
  }

  // Acesso direto à página de manutenção — layout minimal
  if (pathname === "/manutencao" || pathname.startsWith("/manutencao/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-hq-maintenance", "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Rate limit em endpoints sensíveis
  if (
    request.method === "POST" &&
    RATE_LIMITED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const rl = rateLimit({
      key: `${pathname}:${clientIp(request)}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000) || 60),
          },
        },
      );
    }
  }

  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminArea) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/admin") &&
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    !csrfOk(request)
  ) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  if (isPublic(pathname)) {
    if (pathname.startsWith("/admin/login")) {
      const token = request.cookies.get(ADMIN_COOKIE)?.value;
      const session = await verifySessionToken(token);
      if (session) {
        const dest = request.nextUrl.clone();
        dest.pathname = "/admin";
        dest.search = "";
        return NextResponse.redirect(dest);
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const touched = await touchSessionToken(token);

  if (!touched) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login no painel." },
        { status: 401 },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  if (
    pathname.startsWith("/admin") &&
    !canAccessPath(touched.payload.role as AdminRole, pathname)
  ) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/admin";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  const res = NextResponse.next();
  res.cookies.set(ADMIN_COOKIE, touched.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
  });
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
};
