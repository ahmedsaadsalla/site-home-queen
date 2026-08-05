import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import {
  ALLOWED_MEDIA_TYPES,
  emptyMediaLibrary,
  type MediaAsset,
  type MediaFolder,
  type MediaLibrary,
} from "@/data/media";
import { appendAdminLog } from "@/lib/adminStore";
import { prisma } from "@/lib/prisma";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const THUMB_DIR = path.join(UPLOAD_DIR, "thumbs");

export async function readMediaLibrary(): Promise<MediaLibrary> {
  await ensureDirs();
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });
  return {
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      originalName: a.originalName,
      url: a.url,
      thumbUrl: a.thumbUrl,
      webpUrl: a.webpUrl || undefined,
      mime: a.mime,
      size: a.size,
      width: a.width ?? undefined,
      height: a.height ?? undefined,
      folder: a.folder as MediaFolder,
      productId: a.productId || undefined,
      categoryId: a.categoryId || undefined,
      usedIn: a.usedIn || [],
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    updatedAt: new Date().toISOString(),
  };
}

export async function writeMediaLibrary(lib: MediaLibrary) {
  await ensureDirs();
  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.deleteMany({});
    if (!lib.assets.length) return;
    await tx.mediaAsset.createMany({
      data: lib.assets.map((a) => ({
        id: a.id,
        name: a.name,
        originalName: a.originalName,
        url: a.url,
        thumbUrl: a.thumbUrl || "",
        webpUrl: a.webpUrl || null,
        mime: a.mime,
        size: a.size,
        width: a.width ?? null,
        height: a.height ?? null,
        folder: a.folder || "geral",
        productId: a.productId || null,
        categoryId: a.categoryId || null,
        usedIn: a.usedIn || [],
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt || a.createdAt),
      })),
    });
  });
}

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(THUMB_DIR, { recursive: true });
}

function safeBase(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

export async function saveUploadedMedia(opts: {
  file: File;
  folder?: MediaFolder;
  productId?: string;
  categoryId?: string;
  usedIn?: string;
  rotate?: number;
  crop?: { left: number; top: number; width: number; height: number };
}): Promise<MediaAsset> {
  await ensureDirs();
  const mime = opts.file.type || "application/octet-stream";
  if (!ALLOWED_MEDIA_TYPES.includes(mime)) {
    throw new Error("Formato não permitido. Use apenas JPG, PNG, WEBP ou PDF.");
  }

  const buf = Buffer.from(await opts.file.arrayBuffer());
  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const base = `${id}_${safeBase(opts.file.name || "arquivo")}`;
  const isPdf = mime === "application/pdf";

  let url = "";
  let thumbUrl = "";
  let webpUrl: string | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let size = buf.length;

  if (isPdf) {
    const filename = `${base}.pdf`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
    url = `/uploads/${filename}`;
    thumbUrl = url;
  } else {
    let pipeline = sharp(buf, { failOn: "none" }).rotate();
    if (opts.rotate) pipeline = pipeline.rotate(opts.rotate);
    if (opts.crop) {
      pipeline = pipeline.extract({
        left: Math.max(0, Math.round(opts.crop.left)),
        top: Math.max(0, Math.round(opts.crop.top)),
        width: Math.max(1, Math.round(opts.crop.width)),
        height: Math.max(1, Math.round(opts.crop.height)),
      });
    }

    const meta = await pipeline.clone().metadata();
    width = meta.width;
    height = meta.height;

    const maxW = 1920;
    const resized = pipeline.clone().resize({
      width: maxW,
      withoutEnlargement: true,
      fit: "inside",
    });

    const webpName = `${base}.webp`;
    const webpBuf = await resized
      .clone()
      .webp({ quality: 82 })
      .toBuffer();
    await fs.writeFile(path.join(UPLOAD_DIR, webpName), webpBuf);
    webpUrl = `/uploads/${webpName}`;
    url = webpUrl;
    size = webpBuf.length;

    const thumbName = `${base}_thumb.webp`;
    const thumbBuf = await resized
      .clone()
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    await fs.writeFile(path.join(THUMB_DIR, thumbName), thumbBuf);
    thumbUrl = `/uploads/thumbs/${thumbName}`;

    const jpgName = `${base}.jpg`;
    const jpgBuf = await resized.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    await fs.writeFile(path.join(UPLOAD_DIR, jpgName), jpgBuf);
  }

  await ensureDirs();
  const asset: MediaAsset = {
    id,
    name: safeBase(opts.file.name || "imagem"),
    originalName: opts.file.name || "imagem",
    url,
    thumbUrl,
    webpUrl,
    mime: isPdf ? "application/pdf" : "image/webp",
    size,
    width,
    height,
    folder: opts.folder || "geral",
    productId: opts.productId,
    categoryId: opts.categoryId,
    usedIn: opts.usedIn ? [opts.usedIn] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const lib = await readMediaLibrary();
  lib.assets = [asset, ...lib.assets];
  await writeMediaLibrary(lib);
  await appendAdminLog("Upload mídia", `${asset.name} → ${asset.url}`);
  return asset;
}

export async function renameMedia(id: string, name: string) {
  const lib = await readMediaLibrary();
  const asset = lib.assets.find((a) => a.id === id);
  if (!asset) throw new Error("Mídia não encontrada.");
  asset.name = name.trim() || asset.name;
  asset.updatedAt = new Date().toISOString();
  await writeMediaLibrary(lib);
  return asset;
}

export async function deleteMedia(id: string, force = false) {
  const lib = await readMediaLibrary();
  const asset = lib.assets.find((a) => a.id === id);
  if (!asset) throw new Error("Mídia não encontrada.");
  if (!force && asset.usedIn.length > 0) {
    return { ok: false as const, usedIn: asset.usedIn, asset };
  }

  for (const u of [asset.url, asset.thumbUrl, asset.webpUrl]) {
    if (!u?.startsWith("/uploads/")) continue;
    const file = path.join(process.cwd(), "public", u.replace(/^\//, ""));
    try {
      await fs.unlink(file);
    } catch {
      /* ignore */
    }
  }

  lib.assets = lib.assets.filter((a) => a.id !== id);
  await writeMediaLibrary(lib);
  await appendAdminLog("Excluir mídia", asset.name);
  return { ok: true as const, asset };
}

export async function markMediaUsage(url: string, location: string) {
  if (!url) return;
  const lib = await readMediaLibrary();
  const asset = lib.assets.find(
    (a) => a.url === url || a.webpUrl === url || a.thumbUrl === url,
  );
  if (!asset) return;
  if (!asset.usedIn.includes(location)) {
    asset.usedIn = [...asset.usedIn, location];
    asset.updatedAt = new Date().toISOString();
    await writeMediaLibrary(lib);
  }
}
