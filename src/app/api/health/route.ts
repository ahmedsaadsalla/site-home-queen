import { NextResponse } from "next/server";
import { runHealthCheck } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await runHealthCheck();
    const http =
      health.status === "ok" ? 200 : health.status === "warning" ? 200 : 503;
    return NextResponse.json(health, { status: http });
  } catch (e) {
    const { getDatabaseHostInfo } = await import("@/lib/databaseUrl");
    return NextResponse.json(
      {
        status: "error",
        message: e instanceof Error ? e.message : "Health check falhou",
        databaseTarget: getDatabaseHostInfo(),
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
