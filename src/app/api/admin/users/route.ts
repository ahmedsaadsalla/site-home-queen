import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteUser,
  listUsersPublic,
  upsertUser,
} from "@/lib/adminAuthStore";
import {
  ADMIN_COOKIE,
  type AdminRole,
  verifySessionToken,
} from "@/lib/adminSession";

export const runtime = "nodejs";

const ROLES: AdminRole[] = [
  "Administrador",
  "Gerente",
  "Comercial",
  "Financeiro",
  "Produção",
  "Atendimento",
];

async function requireAdmin() {
  const jar = await cookies();
  const payload = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!payload) return null;
  if (payload.role !== "Administrador" && payload.role !== "Gerente") {
    return null;
  }
  return payload;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  const users = await listUsersPublic();
  return NextResponse.json({ users, roles: ROLES });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  try {
    const body = (await request.json()) as {
      action?: "save" | "delete";
      id?: string;
      name?: string;
      username?: string;
      email?: string;
      password?: string;
      role?: AdminRole;
      active?: boolean;
    };

    if (body.action === "delete" && body.id) {
      await deleteUser(body.id, auth.username);
      return NextResponse.json({ ok: true });
    }

    if (!body.name || !body.username || !body.email || !body.role) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }
    if (!ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
    }

    const user = await upsertUser({
      id: body.id,
      name: body.name,
      username: body.username,
      email: body.email,
      password: body.password,
      role: body.role,
      active: body.active ?? true,
      actor: auth.username,
    });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha." },
      { status: 400 },
    );
  }
}
