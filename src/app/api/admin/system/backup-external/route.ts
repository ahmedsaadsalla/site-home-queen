import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import {
  connectExternalProvider,
  disconnectExternalProvider,
  downloadCloudBackupToLocal,
  getBackupSettings,
  getExternalBackupConfig,
  listCloudBackups,
  setBackupSettings,
  setExternalBackupConfig,
  testExternalConnection,
  type BackupProvider,
  type DestinationMode,
} from "@/lib/externalBackup";
import { auditMetaFromRequest, writeAuditLog } from "@/lib/audit";
import { restoreBackupFromFile } from "@/lib/backupService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const list = new URL(request.url).searchParams.get("list") === "cloud";
  const [cfg, settings] = await Promise.all([
    getExternalBackupConfig(),
    getBackupSettings(),
  ]);
  let cloud: unknown[] = [];
  if (list) {
    try {
      cloud = await listCloudBackups();
    } catch {
      cloud = [];
    }
  }
  return NextResponse.json({
    config: {
      ...cfg,
      secretAccessKey: cfg.secretAccessKey ? "••••••••" : "",
      gdriveAccessToken: cfg.gdriveAccessToken ? "••••••••" : "",
      _hasSecret: Boolean(cfg.secretAccessKey),
      _hasGdriveToken: Boolean(cfg.gdriveAccessToken),
    },
    settings,
    cloud,
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (body.settings && typeof body.settings === "object") {
    const next = await setBackupSettings(
      body.settings as Parameters<typeof setBackupSettings>[0],
    );
    await writeAuditLog("Config backup", "Preferências atualizadas", {
      user: auth.username,
      ...auditMetaFromRequest(request),
    });
    return NextResponse.json({ ok: true, settings: next });
  }

  const next = await setExternalBackupConfig({
    provider: body.provider as BackupProvider | undefined,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : undefined,
    connected: body.connected !== undefined ? Boolean(body.connected) : undefined,
    destinationMode: body.destinationMode as DestinationMode | undefined,
    bucket: body.bucket !== undefined ? String(body.bucket) : undefined,
    region: body.region !== undefined ? String(body.region) : undefined,
    endpoint: body.endpoint !== undefined ? String(body.endpoint) : undefined,
    accessKeyId:
      body.accessKeyId !== undefined ? String(body.accessKeyId) : undefined,
    secretAccessKey:
      body.secretAccessKey !== undefined
        ? String(body.secretAccessKey)
        : undefined,
    prefix: body.prefix !== undefined ? String(body.prefix) : undefined,
    gdriveAccessToken:
      body.gdriveAccessToken !== undefined
        ? String(body.gdriveAccessToken)
        : undefined,
    gdriveFolderId:
      body.gdriveFolderId !== undefined
        ? String(body.gdriveFolderId)
        : undefined,
  });
  return NextResponse.json({
    ok: true,
    provider: next.provider,
    enabled: next.enabled,
    destinationMode: next.destinationMode,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    provider?: BackupProvider;
    id?: string;
    file?: string;
  };
  const meta = auditMetaFromRequest(request);

  try {
    if (body.action === "test") {
      const result = await testExternalConnection(body.provider);
      return NextResponse.json(result);
    }
    if (body.action === "connect" && body.provider) {
      const result = await connectExternalProvider(body.provider);
      await writeAuditLog(
        "Backup externo",
        `Conectar ${body.provider}: ${result.ok ? "ok" : result.error}`,
        { user: auth.username, ...meta },
      );
      return NextResponse.json(result);
    }
    if (body.action === "disconnect") {
      await disconnectExternalProvider();
      await writeAuditLog("Backup externo", "Desconectado", {
        user: auth.username,
        ...meta,
      });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "restore_cloud" && body.id) {
      const downloaded = await downloadCloudBackupToLocal({
        id: body.id,
        file: body.file,
      });
      const result = await restoreBackupFromFile(
        downloaded.file,
        auth.username,
      );
      await writeAuditLog(
        "Backup restaurado",
        `Origem cloud: ${downloaded.file}`,
        { user: auth.username, ...meta },
      );
      return NextResponse.json({ ...result, from: "cloud", ok: true });
    }
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha." },
      { status: 500 },
    );
  }
}
