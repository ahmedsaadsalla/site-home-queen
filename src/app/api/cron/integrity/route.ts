import { runIntegrityCheck } from "@/lib/integrityCheck";
import { evaluateSystemAlerts } from "@/lib/systemAlerts";
import { assertCronAuth, cronOk } from "@/lib/cronAuth";
import { captureException } from "@/lib/systemErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;
  const t0 = Date.now();
  try {
    const report = await runIntegrityCheck({ user: "Cron" });
    const alerts = await evaluateSystemAlerts();
    const issues = Array.isArray(report.issues) ? report.issues.length : 0;
    return cronOk({
      durationMs: Date.now() - t0,
      processed: issues + alerts.length,
      integrity: {
        id: report.id,
        status: report.status,
        summary: report.summary,
      },
      alerts: alerts.length,
    });
  } catch (e) {
    await captureException(e, {
      source: "integrity-cron",
      url: "/api/cron/integrity",
      request,
    });
    return Response.json(
      { success: false, error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
