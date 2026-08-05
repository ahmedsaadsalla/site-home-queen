import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import {
  buildSystemReport,
  reportToCsv,
  reportToPdf,
  reportToXlsxXml,
} from "@/lib/systemReports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const jar = await cookies();
  const auth = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format") || "json";
  const report = await buildSystemReport();

  if (format === "csv") {
    return new NextResponse(reportToCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="relatorio-sistema.csv"',
      },
    });
  }
  if (format === "xlsx") {
    return new NextResponse(reportToXlsxXml(report), {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": 'attachment; filename="relatorio-sistema.xls"',
      },
    });
  }
  if (format === "pdf") {
    const buf = reportToPdf(report);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="relatorio-sistema.pdf"',
      },
    });
  }

  return NextResponse.json(report);
}
