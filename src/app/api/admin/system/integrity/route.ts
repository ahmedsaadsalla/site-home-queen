import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import {
  getLatestIntegrityReport,
  runIntegrityCheck,
} from "@/lib/integrityCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const auth = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const latest = await getLatestIntegrityReport();
  return NextResponse.json({ report: latest });
}

export async function POST() {
  const jar = await cookies();
  const auth = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const report = await runIntegrityCheck({ user: auth.username });
  return NextResponse.json({ ok: true, report });
}
