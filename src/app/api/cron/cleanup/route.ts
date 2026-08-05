import { runSystemCleanup } from "@/lib/systemCleanup";
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
  try {
    const result = await runSystemCleanup({ user: "Cron" });
    return cronOk({
      durationMs: result.durationMs,
      processed: result.processed,
      details: result.details,
    });
  } catch (e) {
    await captureException(e, {
      source: "cleanup-cron",
      url: "/api/cron/cleanup",
      request,
    });
    return Response.json(
      { success: false, error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
