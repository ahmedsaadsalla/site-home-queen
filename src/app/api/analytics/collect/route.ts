import { NextResponse } from "next/server";
import { trackSiteView } from "@/lib/siteAnalytics";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      path?: string;
      referrer?: string | null;
      sessionId?: string | null;
      productSlug?: string | null;
    };
    let productId: string | null = null;
    if (body.productSlug) {
      const p = await prisma.product.findFirst({
        where: { slug: body.productSlug, deletedAt: null },
        select: { id: true },
      });
      productId = p?.id || null;
    }
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    await trackSiteView({
      path: body.path || "/",
      referrer: body.referrer,
      sessionId: body.sessionId,
      productId,
      ip,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
