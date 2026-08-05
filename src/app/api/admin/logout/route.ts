import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/adminAuthStore";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (payload) {
    await destroySession(payload.sid, payload.username);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
