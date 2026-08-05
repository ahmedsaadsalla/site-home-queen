import { NextResponse } from "next/server";
import {
  deleteMedia,
  readMediaLibrary,
  renameMedia,
  saveUploadedMedia,
} from "@/lib/mediaStore";
import type { MediaFolder } from "@/data/media";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const folder = searchParams.get("folder") || "";
  const productId = searchParams.get("productId") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const lib = await readMediaLibrary();
  let assets = lib.assets;
  if (folder) assets = assets.filter((a) => a.folder === folder);
  if (productId) assets = assets.filter((a) => a.productId === productId);
  if (categoryId) assets = assets.filter((a) => a.categoryId === categoryId);
  if (q) {
    assets = assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.originalName.toLowerCase().includes(q) ||
        a.usedIn.some((u) => u.toLowerCase().includes(q)),
    );
  }
  return NextResponse.json({ assets, updatedAt: lib.updatedAt });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
    }

    const cropRaw = form.get("crop");
    let crop: { left: number; top: number; width: number; height: number } | undefined;
    if (typeof cropRaw === "string" && cropRaw) {
      crop = JSON.parse(cropRaw) as typeof crop;
    }

    const asset = await saveUploadedMedia({
      file,
      folder: (String(form.get("folder") || "geral") as MediaFolder),
      productId: String(form.get("productId") || "") || undefined,
      categoryId: String(form.get("categoryId") || "") || undefined,
      usedIn: String(form.get("usedIn") || "") || undefined,
      rotate: Number(form.get("rotate") || 0) || undefined,
      crop,
    });
    return NextResponse.json({ ok: true, asset });
  } catch (e) {
    const { captureException } = await import("@/lib/systemErrors");
    await captureException(e, { source: "uploads", url: "/api/admin/media", request });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no upload." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; name?: string };
    if (!body.id || !body.name) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const asset = await renameMedia(body.id, body.name);
    return NextResponse.json({ ok: true, asset });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "1";
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }
    const result = await deleteMedia(id, force);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Imagem em uso.",
          usedIn: result.usedIn,
          confirmRequired: true,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao excluir." },
      { status: 500 },
    );
  }
}
