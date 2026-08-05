import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import {
  createBackupFile,
  getBackupFilePath,
  getBackupStatus,
  listBackupFiles,
  restoreBackupFromFile,
} from "@/lib/backupService";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import { auditMetaFromRequest, writeAuditLog } from "@/lib/audit";
import { captureException } from "@/lib/systemErrors";

export const runtime = "nodejs";

async function requireAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download");

  if (download) {
    try {
      const full = getBackupFilePath(download);
      const buf = await fs.readFile(full);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${download}"`,
        },
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Arquivo não encontrado." },
        { status: 404 },
      );
    }
  }

  try {
    const [files, status] = await Promise.all([
      listBackupFiles(),
      getBackupStatus(),
    ]);
    return NextResponse.json({
      files: files.map((f) => f.file),
      items: files,
      status,
    });
  } catch {
    return NextResponse.json({ files: [], items: [], status: null });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "create" | "restore" | "auto";
      file?: string;
    };
    const meta = auditMetaFromRequest(request);

    if (body.action === "restore" && body.file) {
      const result = await restoreBackupFromFile(body.file, auth.username);
      await writeAuditLog("Backup restaurado", `Origem local: ${body.file}`, {
        user: auth.username,
        ...meta,
      });
      return NextResponse.json(result);
    }

    const automatic = body.action === "auto";
    const result = await createBackupFile({
      user: auth.username,
      automatic,
      kind: automatic ? "daily" : "manual",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    await captureException(e, {
      source: "backup",
      url: "/api/admin/backup",
      user: auth.username,
      request,
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no backup." },
      { status: 500 },
    );
  }
}
