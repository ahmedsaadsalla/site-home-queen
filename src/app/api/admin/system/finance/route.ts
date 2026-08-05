import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import { getFinanceDashboard } from "@/lib/financeStats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const auth = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const data = await getFinanceDashboard();
  return NextResponse.json(data);
}
