import { createHash, createHmac, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";

export type BackupProvider = "none" | "s3" | "r2" | "b2" | "gdrive";
export type DestinationMode = "local" | "local_cloud" | "cloud";

export type ExternalBackupConfig = {
  provider: BackupProvider;
  enabled: boolean;
  connected: boolean;
  destinationMode: DestinationMode;
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
  gdriveAccessToken?: string;
  gdriveFolderId?: string;
  lastCloudAt?: string | null;
  lastCloudFile?: string | null;
  lastCloudSize?: number | null;
  lastCloudStatus?: "ok" | "error" | "skipped" | null;
  lastLocalAt?: string | null;
  lastLocalFile?: string | null;
  lastLocalSize?: number | null;
  lastLocalStatus?: "ok" | "error" | null;
  lastError?: string | null;
};

export type BackupSettings = {
  dailyHour: number;
  retentionDaily: number;
  retentionWeekly: number;
  retentionMonthly: number;
  maxSizeMb: number;
  zip: boolean;
  encryption: boolean;
  encryptionKey: string;
  emailOnSuccess: boolean;
  emailOnFailure: boolean;
  notifyEmail: string;
};

const DEFAULT_EXTERNAL: ExternalBackupConfig = {
  provider: "none",
  enabled: false,
  connected: false,
  destinationMode: "local",
  bucket: "",
  region: "auto",
  endpoint: "",
  accessKeyId: "",
  secretAccessKey: "",
  prefix: "homequeen/",
  lastCloudAt: null,
  lastCloudFile: null,
  lastCloudSize: null,
  lastCloudStatus: null,
  lastLocalAt: null,
  lastLocalFile: null,
  lastLocalSize: null,
  lastLocalStatus: null,
  lastError: null,
};

const DEFAULT_SETTINGS: BackupSettings = {
  dailyHour: 2,
  retentionDaily: 30,
  retentionWeekly: 12,
  retentionMonthly: 12,
  maxSizeMb: 512,
  zip: false,
  encryption: false,
  encryptionKey: "",
  emailOnSuccess: false,
  emailOnFailure: true,
  notifyEmail: "",
};

/** Credenciais do .env têm prioridade quando o campo UI está vazio */
function applyEnvCredentials(cfg: ExternalBackupConfig): ExternalBackupConfig {
  const next = { ...cfg };
  if (next.provider === "s3") {
    next.accessKeyId =
      next.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "";
    next.secretAccessKey =
      next.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "";
    next.region = next.region || process.env.AWS_REGION || "us-east-1";
    next.bucket = next.bucket || process.env.AWS_BUCKET || "";
    if (!next.endpoint && next.bucket) {
      next.endpoint = `https://${next.bucket}.s3.${next.region}.amazonaws.com`;
    }
  }
  if (next.provider === "r2") {
    const account = process.env.R2_ACCOUNT_ID || "";
    next.accessKeyId =
      next.accessKeyId || process.env.R2_ACCESS_KEY_ID || "";
    next.secretAccessKey =
      next.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || "";
    next.bucket = next.bucket || process.env.R2_BUCKET || "";
    next.region = next.region || "auto";
    if (!next.endpoint && account) {
      next.endpoint = `https://${account}.r2.cloudflarestorage.com`;
    }
  }
  if (next.provider === "b2") {
    next.accessKeyId = next.accessKeyId || process.env.B2_KEY_ID || "";
    next.secretAccessKey =
      next.secretAccessKey || process.env.B2_APPLICATION_KEY || "";
    next.bucket = next.bucket || process.env.B2_BUCKET || "";
    // endpoint costuma vir da UI / B2 S3-compatible
  }
  if (next.provider === "gdrive") {
    next.gdriveAccessToken =
      next.gdriveAccessToken ||
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN ||
      "";
  }
  void env;
  return next;
}

export async function getExternalBackupConfig(): Promise<ExternalBackupConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "backup_external" },
    });
    const base = row
      ? { ...DEFAULT_EXTERNAL, ...(row.value as object) }
      : { ...DEFAULT_EXTERNAL };
    return applyEnvCredentials(base);
  } catch {
    return applyEnvCredentials({ ...DEFAULT_EXTERNAL });
  }
}

export async function setExternalBackupConfig(
  partial: Partial<ExternalBackupConfig>,
) {
  const current = await getExternalBackupConfig();
  // Não sobrescrever secrets mascarados
  const clean = { ...partial };
  if (clean.secretAccessKey === "••••••••") delete clean.secretAccessKey;
  if (clean.gdriveAccessToken === "••••••••") delete clean.gdriveAccessToken;
  const next = { ...current, ...clean };
  await prisma.siteSetting.upsert({
    where: { key: "backup_external" },
    create: { key: "backup_external", value: next },
    update: { value: next },
  });
  return applyEnvCredentials(next);
}

export async function getBackupSettings(): Promise<BackupSettings> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "backup_settings" },
    });
    if (!row) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(row.value as object) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function setBackupSettings(partial: Partial<BackupSettings>) {
  const current = await getBackupSettings();
  const next = { ...current, ...partial };
  await prisma.siteSetting.upsert({
    where: { key: "backup_settings" },
    create: { key: "backup_settings", value: next },
    update: { value: next },
  });
  return next;
}

function b64(s: string) {
  return Buffer.from(s, "utf8").toString("base64");
}

async function signS3Put(
  cfg: ExternalBackupConfig,
  key: string,
  body: Buffer,
  contentType: string,
) {
  const endpoint =
    cfg.endpoint ||
    (cfg.provider === "s3"
      ? `https://${cfg.bucket}.s3.${cfg.region || "us-east-1"}.amazonaws.com`
      : "");
  if (!endpoint || !cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucket) {
    throw new Error("Credenciais S3/R2/B2 incompletas.");
  }

  const base = endpoint.replace(/\/$/, "");
  const url = new URL(
    base.includes(cfg.bucket) ? `${base}/${key}` : `${base}/${cfg.bucket}/${key}`,
  );

  const amzDate =
    new Date().toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const region = cfg.region || "auto";
  const payloadHash = createHash("sha256").update(body).digest("hex");
  const canonicalHeaders =
    `host:${url.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const hmac = (key: Buffer | string, data: string) =>
    createHmac("sha256", key).update(data).digest();
  const kSigning = hmac(
    hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, dateStamp), region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { url: url.toString(), amzDate, payloadHash, authorization, contentType };
}

async function uploadS3Compatible(
  cfg: ExternalBackupConfig,
  key: string,
  body: Buffer,
  contentType = "application/json",
) {
  const signed = await signS3Put(cfg, key, body, contentType);
  const res = await fetch(signed.url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": signed.payloadHash,
      "x-amz-date": signed.amzDate,
      Authorization: signed.authorization,
      "Content-Length": String(body.length),
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload externo falhou (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function headS3Compatible(cfg: ExternalBackupConfig, key = "") {
  const probeKey = key || `${(cfg.prefix || "homequeen/").replace(/\/?$/, "/")}.hq-probe`;
  const body = Buffer.from("ok");
  // PUT probe then we consider connection ok
  await uploadS3Compatible(cfg, probeKey, body, "text/plain");
}

async function uploadGoogleDrive(
  cfg: ExternalBackupConfig,
  filename: string,
  body: Buffer,
) {
  const token = cfg.gdriveAccessToken;
  if (!token) throw new Error("Token Google Drive não configurado.");

  const metadata = {
    name: filename,
    parents: cfg.gdriveFolderId ? [cfg.gdriveFolderId] : undefined,
  };
  const boundary = "hq_boundary_" + Date.now();
  const metaPart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n`;
  const filePart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n`;
  const end = `\r\n--${boundary}--`;
  const buf = Buffer.concat([
    Buffer.from(metaPart, "utf8"),
    Buffer.from(filePart, "utf8"),
    body,
    Buffer.from(end, "utf8"),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: new Uint8Array(buf),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Drive falhou (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function listGoogleDrive(cfg: ExternalBackupConfig) {
  const token = cfg.gdriveAccessToken;
  if (!token) throw new Error("Token Google Drive não configurado.");
  const q = encodeURIComponent(
    cfg.gdriveFolderId
      ? `'${cfg.gdriveFolderId}' in parents and trashed=false`
      : "name contains 'backup_' and trashed=false",
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,modifiedTime)&pageSize=50&orderBy=modifiedTime desc`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Listagem Drive falhou (${res.status})`);
  const data = (await res.json()) as {
    files?: Array<{ id: string; name: string; size?: string; modifiedTime?: string }>;
  };
  return (data.files || []).map((f) => ({
    id: f.id,
    file: f.name,
    size: Number(f.size || 0),
    mtime: f.modifiedTime || new Date().toISOString(),
    source: "cloud" as const,
  }));
}

async function downloadGoogleDrive(cfg: ExternalBackupConfig, fileId: string) {
  const token = cfg.gdriveAccessToken;
  if (!token) throw new Error("Token Google Drive não configurado.");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Download Drive falhou (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/** Lista objetos S3 via ListObjectsV2 (simplificado) */
async function listS3Compatible(cfg: ExternalBackupConfig) {
  const endpoint = cfg.endpoint?.replace(/\/$/, "");
  if (!endpoint || !cfg.bucket) throw new Error("Endpoint/bucket ausentes.");
  const prefix = (cfg.prefix || "homequeen/").replace(/\/?$/, "/");
  const url = new URL(
    endpoint.includes(cfg.bucket)
      ? `${endpoint}?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=50`
      : `${endpoint}/${cfg.bucket}?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=50`,
  );

  const amzDate =
    new Date().toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const region = cfg.region || "auto";
  const payloadHash = createHash("sha256").update("").digest("hex");
  const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "GET",
    url.pathname,
    url.search.replace(/^\?/, ""),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const hmac = (key: Buffer | string, data: string) =>
    createHmac("sha256", key).update(data).digest();
  const kSigning = hmac(
    hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, dateStamp), region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url.toString(), {
    headers: {
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
  });
  if (!res.ok) {
    // Fallback: return empty if list not supported
    return [];
  }
  const xml = await res.text();
  const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
  const sizes = [...xml.matchAll(/<Size>([^<]+)<\/Size>/g)].map((m) =>
    Number(m[1]),
  );
  const modified = [...xml.matchAll(/<LastModified>([^<]+)<\/LastModified>/g)].map(
    (m) => m[1],
  );
  return keys.map((k, i) => ({
    id: k,
    file: path.basename(k),
    size: sizes[i] || 0,
    mtime: modified[i] || new Date().toISOString(),
    source: "cloud" as const,
  }));
}

async function downloadS3Compatible(cfg: ExternalBackupConfig, key: string) {
  const endpoint = cfg.endpoint?.replace(/\/$/, "");
  if (!endpoint) throw new Error("Endpoint ausente.");
  const url = new URL(
    endpoint.includes(cfg.bucket)
      ? `${endpoint}/${key}`
      : `${endpoint}/${cfg.bucket}/${key}`,
  );
  const amzDate =
    new Date().toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const region = cfg.region || "auto";
  const payloadHash = createHash("sha256").update("").digest("hex");
  const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "GET",
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const hmac = (keyBuf: Buffer | string, data: string) =>
    createHmac("sha256", keyBuf).update(data).digest();
  const kSigning = hmac(
    hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, dateStamp), region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url.toString(), {
    headers: {
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
  });
  if (!res.ok) throw new Error(`Download cloud falhou (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function testExternalConnection(provider?: BackupProvider) {
  const cfg = await getExternalBackupConfig();
  const use = provider ? { ...cfg, provider } : cfg;
  const resolved = applyEnvCredentials(use);
  if (resolved.provider === "none") {
    return { ok: false, error: "Nenhum provedor selecionado." };
  }
  try {
    if (resolved.provider === "gdrive") {
      await listGoogleDrive(resolved);
    } else {
      await headS3Compatible(resolved);
    }
    await setExternalBackupConfig({
      connected: true,
      lastError: null,
      provider: resolved.provider,
    });
    return { ok: true, provider: resolved.provider };
  } catch (e) {
    await setExternalBackupConfig({
      connected: false,
      lastError: e instanceof Error ? e.message : "Falha",
    });
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Falha na conexão",
    };
  }
}

export async function connectExternalProvider(provider: BackupProvider) {
  const result = await testExternalConnection(provider);
  if (result.ok) {
    await setExternalBackupConfig({
      provider,
      enabled: true,
      connected: true,
      destinationMode:
        (await getExternalBackupConfig()).destinationMode === "local"
          ? "local_cloud"
          : (await getExternalBackupConfig()).destinationMode,
    });
  }
  return result;
}

export async function disconnectExternalProvider() {
  return setExternalBackupConfig({
    enabled: false,
    connected: false,
    provider: "none",
    destinationMode: "local",
  });
}

export async function listCloudBackups() {
  const cfg = await getExternalBackupConfig();
  if (!cfg.enabled || cfg.provider === "none") return [];
  if (cfg.provider === "gdrive") return listGoogleDrive(cfg);
  return listS3Compatible(cfg);
}

export async function downloadCloudBackupToLocal(opts: {
  id: string;
  file?: string;
}) {
  const cfg = await getExternalBackupConfig();
  let buf: Buffer;
  let filename = opts.file || `backup_cloud_${Date.now()}.json`;
  if (cfg.provider === "gdrive") {
    buf = await downloadGoogleDrive(cfg, opts.id);
  } else {
    buf = await downloadS3Compatible(cfg, opts.id);
    filename = path.basename(opts.id);
  }
  // decrypt if needed
  const settings = await getBackupSettings();
  if (settings.encryption && settings.encryptionKey && buf[0] === 0x01) {
    buf = decryptBuffer(buf, settings.encryptionKey);
  }
  const dir = path.join(process.cwd(), "data", "backups");
  await fs.mkdir(dir, { recursive: true });
  const safe = path.basename(filename).replace(/[^\w.\-]+/g, "_");
  const full = path.join(dir, safe.endsWith(".json") ? safe : `${safe}.json`);
  await fs.writeFile(full, buf);
  return { file: path.basename(full), path: full, size: buf.length };
}

function encryptBuffer(buf: Buffer, keyStr: string) {
  const key = createHash("sha256").update(keyStr).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([0x01]), iv, tag, enc]);
}

function decryptBuffer(buf: Buffer, keyStr: string) {
  const key = createHash("sha256").update(keyStr).digest();
  const iv = buf.subarray(1, 13);
  const tag = buf.subarray(13, 29);
  const data = buf.subarray(29);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/** Empacota e envia backup conforme destino (local / cloud / ambos) */
export async function pushBackupExternal(
  localPath: string,
  filename: string,
  opts?: { user?: string; skipLocalMark?: boolean },
) {
  const cfg = await getExternalBackupConfig();
  const settings = await getBackupSettings();
  const mode = cfg.destinationMode || "local";

  if (mode === "local" || !cfg.enabled || cfg.provider === "none") {
    await setExternalBackupConfig({
      lastLocalAt: new Date().toISOString(),
      lastLocalFile: filename,
      lastLocalSize: (await fs.stat(localPath)).size,
      lastLocalStatus: "ok",
      lastCloudStatus: "skipped",
    });
    return { skipped: true as const, mode };
  }

  let body = await fs.readFile(localPath);
  if (settings.encryption && settings.encryptionKey) {
    body = encryptBuffer(body, settings.encryptionKey);
    filename = filename.replace(/\.json$/i, "") + ".hqenc";
  }
  if (settings.maxSizeMb > 0 && body.length > settings.maxSizeMb * 1024 * 1024) {
    throw new Error(
      `Backup excede tamanho máximo (${settings.maxSizeMb} MB).`,
    );
  }

  const key = `${(cfg.prefix || "homequeen/").replace(/\/?$/, "/")}${filename}`;
  const t0 = Date.now();
  try {
    if (cfg.provider === "gdrive") {
      await uploadGoogleDrive(cfg, filename, body);
    } else {
      await uploadS3Compatible(cfg, key, body);
    }
    const durationMs = Date.now() - t0;
    await setExternalBackupConfig({
      lastCloudAt: new Date().toISOString(),
      lastCloudFile: filename,
      lastCloudSize: body.length,
      lastCloudStatus: "ok",
      lastError: null,
      connected: true,
    });
    await writeAuditLog(
      "Backup enviado",
      `${cfg.provider}: ${filename} (${body.length} bytes) em ${durationMs}ms`,
      { user: opts?.user || "Sistema" },
    );

    // Se somente cloud, remove local
    if (mode === "cloud") {
      await fs.unlink(localPath).catch(() => undefined);
    }

    return {
      skipped: false as const,
      provider: cfg.provider,
      key,
      size: body.length,
      durationMs,
    };
  } catch (e) {
    await setExternalBackupConfig({
      lastCloudStatus: "error",
      lastError: e instanceof Error ? e.message : "erro",
      connected: false,
    });
    throw e;
  }
}

export function providerStatusLabel(cfg: ExternalBackupConfig) {
  if (cfg.provider === "none" || !cfg.enabled) return "Desconectado";
  if (cfg.connected) return "Conectado";
  if (cfg.lastCloudStatus === "error") return "Erro";
  return "Configurado";
}

void b64;
