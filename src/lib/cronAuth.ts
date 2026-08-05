import { NextResponse } from "next/server";

export function assertCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET || "";
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const urlToken = new URL(request.url).searchParams.get("secret") || "";
  if (!secret || (token !== secret && urlToken !== secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return null;
}

export function cronOk(data: {
  processed?: number;
  durationMs: number;
  [key: string]: unknown;
}) {
  const { durationMs, processed = 0, ...rest } = data;
  return NextResponse.json({
    success: true,
    duration: `${(durationMs / 1000).toFixed(1)}s`,
    processed,
    ...rest,
  });
}
