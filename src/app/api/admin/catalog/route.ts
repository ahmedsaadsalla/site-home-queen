import { NextResponse } from "next/server";
import {
  bulkUpdateProducts,
  countProductsInCategory,
  deleteCategory,
  duplicateCategory,
  duplicateProduct,
  listCatalogPublic,
  readAdminCatalog,
  reorderCategories,
  restoreProduct,
  saveCategory,
  saveProduct,
  setCategoryActive,
  softDeleteProducts,
} from "@/lib/catalogAdminStore";
import type { AdminCategory, AdminProduct } from "@/data/adminCatalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "admin";

  if (view === "public") {
    const data = await listCatalogPublic();
    return NextResponse.json(data);
  }

  const catalog = await readAdminCatalog();
  const categories = catalog.categories
    .filter((c) => !c.deletedAt)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      ...c,
      productCount: countProductsInCategory(catalog, c.id),
    }));

  const includeDeleted = searchParams.get("deleted") === "1";
  const products = catalog.products
    .filter((p) => (includeDeleted ? true : !p.deletedAt))
    .sort((a, b) => a.order - b.order);

  return NextResponse.json({
    categories,
    products,
    brands: catalog.brands,
    updatedAt: catalog.updatedAt,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      entity?: "category" | "product";
      action?: string;
      data?: Partial<AdminCategory> & Partial<AdminProduct> & { name?: string };
      id?: string;
      ids?: string[];
      orderedIds?: string[];
      moveToId?: string;
      mode?: "move" | "force";
      patch?: Partial<AdminProduct>;
      user?: string;
    };

    const user = body.user || "Administrador";
    const entity = body.entity || "product";
    const action = body.action || "save";

    if (entity === "category") {
      if (action === "save") {
        if (!body.data?.name) {
          return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
        }
        const cat = await saveCategory(
          body.data as Partial<AdminCategory> & { name: string },
          user,
        );
        return NextResponse.json({ ok: true, category: cat });
      }
      if (action === "duplicate" && body.id) {
        const cat = await duplicateCategory(body.id, user);
        return NextResponse.json({ ok: true, category: cat });
      }
      if (action === "hide" && body.id) {
        const cat = await setCategoryActive(body.id, false, user);
        return NextResponse.json({ ok: true, category: cat });
      }
      if (action === "show" && body.id) {
        const cat = await setCategoryActive(body.id, true, user);
        return NextResponse.json({ ok: true, category: cat });
      }
      if (action === "delete" && body.id) {
        const catalog = await readAdminCatalog();
        const count = countProductsInCategory(catalog, body.id);
        if (count > 0 && !body.mode) {
          return NextResponse.json(
            {
              error: "Categoria possui produtos.",
              productCount: count,
              confirmRequired: true,
            },
            { status: 409 },
          );
        }
        const result = await deleteCategory({
          id: body.id,
          mode: body.mode || "force",
          moveToId: body.moveToId,
          user,
        });
        return NextResponse.json(result);
      }
      if (action === "reorder" && body.orderedIds) {
        await reorderCategories(body.orderedIds, user);
        return NextResponse.json({ ok: true });
      }
    }

    if (entity === "product") {
      if (action === "save") {
        if (!body.data?.name) {
          return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
        }
        const product = await saveProduct(
          body.data as Partial<AdminProduct> & { name: string },
          user,
        );
        return NextResponse.json({ ok: true, product });
      }
      if (action === "duplicate" && body.id) {
        const product = await duplicateProduct(body.id, user);
        return NextResponse.json({ ok: true, product });
      }
      if (action === "delete" && body.ids?.length) {
        const count = await softDeleteProducts(body.ids, user);
        return NextResponse.json({ ok: true, count });
      }
      if (action === "restore" && body.id) {
        const product = await restoreProduct(body.id, user);
        return NextResponse.json({ ok: true, product });
      }
      if (action === "bulk" && body.ids?.length && body.patch) {
        const count = await bulkUpdateProducts(body.ids, body.patch, user);
        return NextResponse.json({ ok: true, count });
      }
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha." },
      { status: 500 },
    );
  }
}
