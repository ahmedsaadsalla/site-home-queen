import {
  slugify,
  type AdminCatalog,
  type AdminCategory,
  type AdminProduct,
} from "@/data/adminCatalog";
import { homeCatalogConfig } from "@/data/homeCatalog";
import { syncCatalogEntityToBling } from "@/lib/blingCatalog";
import { prisma } from "@/lib/prisma";
import {
  categoryToAdmin,
  categoryToDb,
  productToAdmin,
  productToDb,
  iso,
} from "@/lib/db/mappers";
import type { Prisma } from "@prisma/client";

function now() {
  return new Date().toISOString();
}

async function log(action: string, detail: string, user = "Administrador") {
  const { appendAdminLog } = await import("@/lib/adminStore");
  return appendAdminLog(action, detail, user);
}

async function autoBling(
  kind: "product" | "category",
  entity: AdminProduct | AdminCategory,
  action: string,
) {
  const { readAdminCms } = await import("@/lib/adminStore");
  const cms = await readAdminCms();
  return syncCatalogEntityToBling({
    kind,
    entity,
    action,
    enabled: cms.integrations.bling.enabled,
    apiKey: cms.integrations.bling.apiKey,
  });
}

async function ensureCatalogSeeded() {
  const count = await prisma.category.count();
  if (count > 0) return;

  const ts = new Date();
  const categories = homeCatalogConfig.categories
    .filter((c) => c.id !== "todos")
    .map((c, i) => ({
      id: c.id,
      name: c.label,
      slug: c.id,
      banner: "",
      icon: "",
      image: "",
      order: c.order ?? i + 1,
      parentId: null as string | null,
      description: "",
      seoTitle: `${c.label} | Home Queen`,
      seoDescription: `Confira ${c.label} Home Queen.`,
      seoKeywords: c.label.toLowerCase(),
      ogImage: "",
      indexable: true,
      minQty: 3,
      active: c.visible,
      createdAt: ts,
      updatedAt: ts,
    }));

  await prisma.category.createMany({ data: categories });

  const products = homeCatalogConfig.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name) || p.id,
    sku: `HQ-${p.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`,
    code: `COD-${p.order.toString().padStart(4, "0")}`,
    categoryId: p.categoryId,
    brand: "Home Queen",
    image: p.image,
    cover: p.image,
    gallery: [p.image],
    wholesaleImage: "",
    wholesaleCover: "",
    wholesaleGallery: [] as string[],
    video: "",
    colors: [
      { name: "Preto", hex: "#1A1A1A" },
      { name: "Bege", hex: "#C8B89A" },
    ] as unknown as Prisma.InputJsonValue,
    defaultColor: "Preto",
    retailPrice: p.price,
    wholesalePrice: Math.round(p.price * 0.72),
    minQty: 3,
    stock: 20 + (p.order % 15),
    active: true,
    featured: p.featured,
    promotion: p.badge === "Promoção",
    launch: p.badge === "Novo",
    description: "",
    seoTitle: `${p.name} | Home Queen`,
    seoDescription: "",
    seoKeywords: "",
    ogImage: p.image,
    indexable: true,
    order: p.order,
    createdAt: ts,
    updatedAt: ts,
  }));

  const catIds = new Set(categories.map((c) => c.id));
  await prisma.product.createMany({
    data: products.filter((p) => catIds.has(p.categoryId)),
  });

  for (const b of ["Home Queen", "Ortobom", "Castor", "Outros"]) {
    await prisma.brand.upsert({
      where: { name: b },
      create: { name: b },
      update: {},
    });
  }
}

/** Catálogo estático quando o banco está indisponível (ex.: DATABASE_URL ausente). */
export function fallbackAdminCatalog(): AdminCatalog {
  const ts = now();
  const categories: AdminCategory[] = homeCatalogConfig.categories
    .filter((c) => c.id !== "todos")
    .map((c, i) => ({
      id: c.id,
      name: c.label,
      slug: c.id,
      banner: "",
      icon: "",
      image: "",
      order: c.order ?? i + 1,
      parentId: null,
      description: "",
      seoTitle: `${c.label} | Home Queen`,
      seoDescription: `Confira ${c.label} Home Queen.`,
      seoKeywords: c.label.toLowerCase(),
      ogImage: "",
      indexable: true,
      minQty: 3,
      active: c.visible,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    }));

  const products: AdminProduct[] = homeCatalogConfig.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name) || p.id,
    sku: `HQ-${p.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`,
    code: `COD-${p.order.toString().padStart(4, "0")}`,
    categoryId: p.categoryId,
    brand: "Home Queen",
    image: p.image,
    cover: p.image,
    gallery: [p.image],
    wholesaleImage: "",
    wholesaleCover: "",
    wholesaleGallery: [],
    video: "",
    colors: [
      { name: "Preto", hex: "#1A1A1A" },
      { name: "Bege", hex: "#C8B89A" },
    ],
    defaultColor: "Preto",
    retailPrice: p.price,
    wholesalePrice: Math.round(p.price * 0.72),
    minQty: 3,
    stock: 20 + (p.order % 15),
    active: true,
    featured: p.featured,
    promotion: p.badge === "Promoção",
    launch: p.badge === "Novo",
    description: "",
    seoTitle: `${p.name} | Home Queen`,
    seoDescription: p.name,
    seoKeywords: "",
    ogImage: p.image,
    indexable: true,
    order: p.order,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  }));

  return {
    categories,
    products,
    brands: ["Home Queen", "Ortobom", "Castor", "Outros"],
    updatedAt: ts,
  };
}

export async function readAdminCatalog(): Promise<AdminCatalog> {
  try {
    await ensureCatalogSeeded();
    const [categories, products, brands] = await Promise.all([
      prisma.category.findMany({ orderBy: { order: "asc" } }),
      prisma.product.findMany({ orderBy: { order: "asc" } }),
      prisma.brand.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      categories: categories.map(categoryToAdmin),
      products: products.map(productToAdmin),
      brands: brands.map((b) => b.name),
      updatedAt: now(),
    };
  } catch (e) {
    console.error("[readAdminCatalog]", e);
    return fallbackAdminCatalog();
  }
}

export async function writeAdminCatalog(catalog: AdminCatalog) {
  await prisma.$transaction(async (tx) => {
    await tx.product.deleteMany({});
    await tx.category.deleteMany({});
    await tx.brand.deleteMany({});

    if (catalog.categories.length) {
      await tx.category.createMany({
        data: catalog.categories.map((c) => categoryToDb(c)),
      });
    }
    if (catalog.products.length) {
      await tx.product.createMany({
        data: catalog.products.map((p) => productToDb(p)),
      });
    }
    for (const name of catalog.brands) {
      await tx.brand.create({ data: { name } });
    }
  });
}

export async function listCatalogPublic() {
  const catalog = await readAdminCatalog();
  return {
    categories: catalog.categories
      .filter((c) => !c.deletedAt && c.active)
      .sort((a, b) => a.order - b.order)
      .map(({ minQty: _m, ...c }) => c),
    products: catalog.products
      .filter((p) => !p.deletedAt && p.active)
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        brand: p.brand,
        image: p.image,
        cover: p.cover,
        gallery: p.gallery,
        video: p.video,
        retailPrice: p.retailPrice,
        description: p.description,
        featured: p.featured,
        order: p.order,
        active: p.active,
        colors: p.colors || [],
        defaultColor: p.defaultColor || "",
      })),
    brands: catalog.brands,
  };
}

export async function saveCategory(
  input: Partial<AdminCategory> & { name: string },
  user = "Administrador",
) {
  await ensureCatalogSeeded();
  if (input.id) {
    const existing = await prisma.category.findUnique({
      where: { id: input.id },
    });
    if (existing) {
      const updated = await prisma.category.update({
        where: { id: input.id },
        data: {
          ...categoryToDb({
            ...categoryToAdmin(existing),
            ...input,
            id: existing.id,
            name: input.name,
            slug: input.slug || existing.slug || slugify(input.name),
          }),
        },
      });
      const admin = categoryToAdmin(updated);
      await log("Alterou Categoria", admin.name, user);
      await autoBling("category", admin, "update");
      return admin;
    }
  }

  const id = input.id || slugify(input.name) || `cat_${Date.now().toString(36)}`;
  const count = await prisma.category.count();
  const created = await prisma.category.create({
    data: categoryToDb({
      id,
      name: input.name,
      slug: input.slug || slugify(input.name) || id,
      banner: input.banner || "",
      icon: input.icon || "",
      image: input.image || "",
      order: input.order ?? count + 1,
      parentId: input.parentId ?? null,
      description: input.description || "",
      seoTitle: input.seoTitle || `${input.name} | Home Queen`,
      seoDescription: input.seoDescription || "",
      seoKeywords: input.seoKeywords || "",
      ogImage: input.ogImage || input.image || "",
      indexable: input.indexable !== false,
      minQty: input.minQty ?? 3,
      active: input.active ?? true,
    }),
  });
  const admin = categoryToAdmin(created);
  await log("Criou Categoria", admin.name, user);
  await autoBling("category", admin, "create");
  return admin;
}

export async function duplicateCategory(id: string, user = "Administrador") {
  const src = await prisma.category.findFirst({
    where: { id, deletedAt: null },
  });
  if (!src) throw new Error("Categoria não encontrada.");
  const admin = categoryToAdmin(src);
  const count = await prisma.category.count({ where: { deletedAt: null } });
  return saveCategory(
    {
      name: `${src.name} (cópia)`,
      slug: `${src.slug}-copia-${Date.now().toString(36).slice(-4)}`,
      banner: admin.banner,
      icon: admin.icon,
      image: admin.image,
      order: count + 1,
      parentId: admin.parentId,
      description: admin.description,
      seoTitle: admin.seoTitle,
      seoDescription: admin.seoDescription,
      seoKeywords: admin.seoKeywords,
      ogImage: admin.ogImage,
      indexable: admin.indexable,
      minQty: admin.minQty,
      active: admin.active,
    },
    user,
  );
}

export async function setCategoryActive(
  id: string,
  active: boolean,
  user = "Administrador",
) {
  const cat = await prisma.category.update({
    where: { id },
    data: { active },
  });
  const admin = categoryToAdmin(cat);
  await log(
    active ? "Ativou Categoria" : "Ocultou Categoria",
    admin.name,
    user,
  );
  await autoBling("category", admin, "status");
  return admin;
}

export async function deleteCategory(opts: {
  id: string;
  mode: "move" | "force";
  moveToId?: string;
  user?: string;
}) {
  const user = opts.user || "Administrador";
  const cat = await prisma.category.findUnique({ where: { id: opts.id } });
  if (!cat) throw new Error("Categoria não encontrada.");

  const products = await prisma.product.findMany({
    where: { categoryId: opts.id, deletedAt: null },
  });

  if (opts.mode === "move") {
    if (!opts.moveToId) throw new Error("Selecione a categoria destino.");
    if (opts.moveToId === opts.id) throw new Error("Selecione outra categoria.");
    const dest = await prisma.category.findFirst({
      where: { id: opts.moveToId, deletedAt: null },
    });
    if (!dest) throw new Error("Categoria destino inválida.");
    await prisma.product.updateMany({
      where: { categoryId: opts.id, deletedAt: null },
      data: { categoryId: opts.moveToId },
    });
    for (const p of products) {
      await autoBling("product", productToAdmin(p), "move-category");
    }
  }

  await prisma.category.update({
    where: { id: opts.id },
    data: { deletedAt: new Date(), active: false },
  });
  await log(
    "Excluiu Categoria",
    `${cat.name} (${products.length} produtos · ${opts.mode})`,
    user,
  );
  await autoBling("category", categoryToAdmin(cat), "delete");
  return { ok: true, moved: opts.mode === "move" ? products.length : 0 };
}

export async function reorderCategories(
  orderedIds: string[],
  user = "Administrador",
) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { order: index + 1 },
      }),
    ),
  );
  await log("Reordenou Categorias", `${orderedIds.length} itens`, user);
  return (await readAdminCatalog()).categories;
}

export async function saveProduct(
  input: Partial<AdminProduct> & { name: string },
  user = "Administrador",
) {
  await ensureCatalogSeeded();

  if (input.id) {
    const existing = await prisma.product.findUnique({
      where: { id: input.id },
    });
    if (existing) {
      const base = productToAdmin(existing);
      const payload = productToDb({
        ...base,
        ...input,
        id: existing.id,
        name: input.name,
        slug: input.slug || existing.slug || slugify(input.name),
      });
      let blingSyncedAt = existing.blingSyncedAt;
      const updatedForBling = { ...base, ...input, id: existing.id } as AdminProduct;
      const bling = await autoBling("product", updatedForBling, "update");
      if (bling.ok) blingSyncedAt = new Date();

      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: { ...payload, blingSyncedAt },
      });
      if (input.brand) {
        await prisma.brand.upsert({
          where: { name: input.brand },
          create: { name: input.brand },
          update: {},
        });
      }
      await log("Alterou Produto", updated.name, user);
      return productToAdmin(updated);
    }
  }

  const firstCat = await prisma.category.findFirst({
    where: { deletedAt: null },
    orderBy: { order: "asc" },
  });
  const count = await prisma.product.count();
  const id = input.id || `p_${Date.now().toString(36)}`;
  const createdData = productToDb({
    id,
    name: input.name,
    slug: input.slug || slugify(input.name) || id,
    sku: input.sku || `HQ-${Date.now().toString(36).toUpperCase()}`,
    code: input.code || `COD-${Date.now().toString().slice(-6)}`,
    categoryId: input.categoryId || firstCat?.id || "",
    brand: input.brand || "Home Queen",
    image: input.image || "",
    cover: input.cover || input.image || "",
    gallery: input.gallery || (input.image ? [input.image] : []),
    wholesaleImage: input.wholesaleImage || "",
    wholesaleCover: input.wholesaleCover || "",
    wholesaleGallery: input.wholesaleGallery || [],
    video: input.video || "",
    colors: Array.isArray(input.colors) ? input.colors : [],
    defaultColor: input.defaultColor || "",
    retailPrice: input.retailPrice ?? 0,
    wholesalePrice: input.wholesalePrice ?? 0,
    minQty: input.minQty ?? 3,
    stock: input.stock ?? 0,
    active: input.active ?? true,
    featured: input.featured ?? false,
    promotion: input.promotion ?? false,
    launch: input.launch ?? false,
    description: input.description || "",
    seoTitle: input.seoTitle || `${input.name} | Home Queen`,
    seoDescription: input.seoDescription || input.description || "",
    seoKeywords: input.seoKeywords || "",
    ogImage: input.ogImage || input.cover || input.image || "",
    indexable: input.indexable !== false,
    order: input.order ?? count + 1,
  });

  const created = await prisma.product.create({ data: createdData });
  let result = productToAdmin(created);
  const bling = await autoBling("product", result, "create");
  if (bling.ok) {
    result = productToAdmin(
      await prisma.product.update({
        where: { id: created.id },
        data: { blingSyncedAt: new Date() },
      }),
    );
  }
  if (result.brand) {
    await prisma.brand.upsert({
      where: { name: result.brand },
      create: { name: result.brand },
      update: {},
    });
  }
  await log("Criou Produto", result.name, user);
  return result;
}

export async function duplicateProduct(id: string, user = "Administrador") {
  const src = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  if (!src) throw new Error("Produto não encontrado.");
  const admin = productToAdmin(src);
  return saveProduct(
    {
      name: `${src.name} (cópia)`,
      sku: `${src.sku}-C`,
      code: `${src.code}-C`,
      slug: `${src.slug}-copia`,
      categoryId: admin.categoryId,
      brand: admin.brand,
      image: admin.image,
      cover: admin.cover,
      gallery: admin.gallery,
      wholesaleImage: admin.wholesaleImage,
      wholesaleCover: admin.wholesaleCover,
      wholesaleGallery: admin.wholesaleGallery,
      video: admin.video,
      colors: admin.colors,
      defaultColor: admin.defaultColor,
      retailPrice: admin.retailPrice,
      wholesalePrice: admin.wholesalePrice,
      minQty: admin.minQty,
      stock: admin.stock,
      active: admin.active,
      featured: admin.featured,
      promotion: admin.promotion,
      launch: admin.launch,
      description: admin.description,
      seoTitle: admin.seoTitle,
      seoDescription: admin.seoDescription,
      seoKeywords: admin.seoKeywords,
      ogImage: admin.ogImage,
      indexable: admin.indexable,
    },
    user,
  );
}

export async function softDeleteProducts(ids: string[], user = "Administrador") {
  const ts = new Date();
  let count = 0;
  for (const id of ids) {
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p || p.deletedAt) continue;
    await prisma.product.update({
      where: { id },
      data: { deletedAt: ts, active: false },
    });
    count += 1;
    await autoBling("product", productToAdmin(p), "delete");
    await log("Excluiu Produto", p.name, user);
  }
  return count;
}

export async function restoreProduct(id: string, user = "Administrador") {
  const p = await prisma.product.update({
    where: { id },
    data: { deletedAt: null, active: true },
  });
  const admin = productToAdmin(p);
  await log("Restaurou Produto", admin.name, user);
  await autoBling("product", admin, "restore");
  return admin;
}

export async function bulkUpdateProducts(
  ids: string[],
  patch: Partial<AdminProduct>,
  user = "Administrador",
) {
  let count = 0;
  for (const id of ids) {
    const p = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!p) continue;
    const merged = productToDb({ ...productToAdmin(p), ...patch, id, name: p.name });
    const updated = await prisma.product.update({
      where: { id },
      data: merged,
    });
    count += 1;
    await autoBling("product", productToAdmin(updated), "bulk-update");
  }
  await log(
    "Alterou Produto",
    `Ação em massa · ${count} itens · ${JSON.stringify(patch)}`,
    user,
  );
  return count;
}

export function countProductsInCategory(
  catalog: AdminCatalog,
  categoryId: string,
) {
  return catalog.products.filter(
    (p) => p.categoryId === categoryId && !p.deletedAt,
  ).length;
}

// re-export for import script
export { iso };
