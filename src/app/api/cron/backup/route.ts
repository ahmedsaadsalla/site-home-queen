import { captureException } from "@/lib/systemErrors";
import { runScheduledBackups } from "@/lib/backupService";
import { assertCronAuth, cronOk } from "@/lib/cronAuth";

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
    const force = new URL(request.url).searchParams.get("force") === "1";
    const result = await runScheduledBackups({ force });
    return cronOk({
      durationMs: Date.now() - t0,
      processed: result.created.length + result.pruned.length,
      ...result,
    });
  } catch (e) {
    await captureException(e, {
      source: "backup-cron",
      url: "/api/cron/backup",
      request,
    });
    return Response.json(
      { success: false, error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
