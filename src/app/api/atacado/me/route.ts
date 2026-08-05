import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { publicDealer, readDealers } from "@/lib/wholesaleStore";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const id = jar.get("hq_dealer_session")?.value;
  if (!id) {
    return NextResponse.json({ authenticated: false });
  }
  const dealers = await readDealers();
  const dealer = dealers.find((d) => d.id === id);
  if (!dealer || dealer.status !== "Aprovado" || dealer.blocked) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    dealer: publicDealer(dealer),
  });
}
