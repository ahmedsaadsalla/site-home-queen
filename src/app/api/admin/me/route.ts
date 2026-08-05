import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserById, touchSession } from "@/lib/adminAuthStore";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  await touchSession(payload.sid);
  const user = await findUserById(payload.uid);
  if (!user || !user.active) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
}
