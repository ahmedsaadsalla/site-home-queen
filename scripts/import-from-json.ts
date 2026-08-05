/**
 * Importa dados dos JSON legados em data/ → PostgreSQL.
 * Uso: npx tsx scripts/import-from-json.ts
 *
 * Após a importação, o banco é a fonte oficial.
 * Os JSON permanecem apenas como backup de emergência.
 */
import { promises as fs } from "fs";
import path from "path";
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const DATA = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  console.log("→ Importando data/*.json para PostgreSQL…");

  // CMS
  const cms = await readJson<Record<string, unknown>>("admin-cms.json", {});
  const sectionKeys = [
    "home",
    "factory",
    "wholesale",
    "contactPage",
    "quotePage",
    "seo",
    "pageMedia",
    "productOverrides",
    "categoryOverrides",
    "integrations",
  ];
  for (const key of sectionKeys) {
    if (cms[key] === undefined) continue;
    await prisma.cmsSection.upsert({
      where: { key },
      create: { key, data: cms[key] as Prisma.InputJsonValue },
      update: { data: cms[key] as Prisma.InputJsonValue },
    });
  }
  console.log("  ✓ CMS sections");

  // Catalog
  const catalog = await readJson<{
    categories?: Array<Record<string, unknown>>;
    products?: Array<Record<string, unknown>>;
    brands?: string[];
  }>("admin-catalog.json", {});

  if (catalog.categories?.length) {
    for (const c of catalog.categories) {
      await prisma.category.upsert({
        where: { id: String(c.id) },
        create: {
          id: String(c.id),
          name: String(c.name || c.id),
          slug: String(c.slug || c.id),
          banner: String(c.banner || ""),
          icon: String(c.icon || ""),
          image: String(c.image || ""),
          order: Number(c.order || 0),
          parentId: (c.parentId as string) || null,
          description: String(c.description || ""),
          seoTitle: String(c.seoTitle || ""),
          seoDescription: String(c.seoDescription || ""),
          seoKeywords: String(c.seoKeywords || ""),
          ogImage: String(c.ogImage || ""),
          indexable: c.indexable !== false,
          minQty: Number(c.minQty || 3),
          active: c.active !== false,
          deletedAt: c.deletedAt ? new Date(String(c.deletedAt)) : null,
        },
        update: {
          name: String(c.name || c.id),
          slug: String(c.slug || c.id),
        },
      });
    }
  }

  if (catalog.products?.length) {
    for (const p of catalog.products) {
      try {
        await prisma.product.upsert({
          where: { id: String(p.id) },
          create: {
            id: String(p.id),
            name: String(p.name),
            slug: String(p.slug || p.id),
            sku: String(p.sku || ""),
            code: String(p.code || ""),
            categoryId: String(p.categoryId),
            brand: String(p.brand || "Home Queen"),
            image: String(p.image || ""),
            cover: String(p.cover || p.image || ""),
            gallery: Array.isArray(p.gallery) ? (p.gallery as string[]) : [],
            wholesaleImage: String(p.wholesaleImage || ""),
            wholesaleCover: String(p.wholesaleCover || ""),
            wholesaleGallery: Array.isArray(p.wholesaleGallery)
              ? (p.wholesaleGallery as string[])
              : [],
            video: String(p.video || ""),
            colors: (p.colors || []) as Prisma.InputJsonValue,
            defaultColor: String(p.defaultColor || ""),
            retailPrice: Number(p.retailPrice || 0),
            wholesalePrice: Number(p.wholesalePrice || 0),
            minQty: Number(p.minQty || 3),
            stock: Number(p.stock || 0),
            active: p.active !== false,
            featured: Boolean(p.featured),
            promotion: Boolean(p.promotion),
            launch: Boolean(p.launch),
            description: String(p.description || ""),
            seoTitle: String(p.seoTitle || ""),
            seoDescription: String(p.seoDescription || ""),
            seoKeywords: String(p.seoKeywords || ""),
            ogImage: String(p.ogImage || ""),
            indexable: p.indexable !== false,
            order: Number(p.order || 0),
            deletedAt: p.deletedAt ? new Date(String(p.deletedAt)) : null,
          },
          update: {
            name: String(p.name),
            stock: Number(p.stock || 0),
            retailPrice: Number(p.retailPrice || 0),
          },
        });
      } catch (e) {
        console.warn("  ! produto skip", p.id, e);
      }
    }
  }

  for (const name of catalog.brands || []) {
    await prisma.brand.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  console.log("  ✓ catálogo");

  // Security
  const sec = await readJson<{
    users?: Array<Record<string, unknown>>;
    lastBackupAt?: string | null;
    lastResetLink?: string | null;
  }>("admin-security.json", {});

  for (const u of sec.users || []) {
    await prisma.adminUser.upsert({
      where: { id: String(u.id) },
      create: {
        id: String(u.id),
        name: String(u.name),
        username: String(u.username),
        email: String(u.email),
        passwordHash: String(u.passwordHash),
        role: String(u.role || "Administrador"),
        active: u.active !== false,
        lastLoginAt: u.lastLoginAt ? new Date(String(u.lastLoginAt)) : null,
      },
      update: {
        passwordHash: String(u.passwordHash),
        role: String(u.role || "Administrador"),
      },
    });
  }
  await prisma.securitySettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      lastBackupAt: sec.lastBackupAt ? new Date(sec.lastBackupAt) : null,
      lastResetLink: sec.lastResetLink || null,
    },
    update: {
      lastBackupAt: sec.lastBackupAt ? new Date(sec.lastBackupAt) : null,
    },
  });
  console.log("  ✓ segurança / admin");

  // Customers
  const customers = await readJson<Array<Record<string, unknown>>>(
    "clientes-cpf.json",
    [],
  );
  for (const c of customers) {
    try {
      await prisma.customer.upsert({
        where: { id: String(c.id) },
        create: {
          id: String(c.id),
          name: String(c.name),
          cpf: String(c.cpf),
          email: String(c.email),
          phone: String(c.phone || ""),
          whatsapp: String(c.whatsapp || ""),
          passwordHash: String(c.passwordHash || ""),
          favoriteProductIds: Array.isArray(c.favoriteProductIds)
            ? (c.favoriteProductIds as string[])
            : [],
          createdAt: new Date(String(c.createdAt || Date.now())),
        },
        update: {
          name: String(c.name),
          email: String(c.email),
        },
      });
    } catch (e) {
      console.warn("  ! cliente skip", c.id, e);
    }
  }
  console.log("  ✓ clientes CPF");

  // Dealers
  const dealers = await readJson<Array<Record<string, unknown>>>(
    "revendedores.json",
    [],
  );
  for (const d of dealers) {
    try {
      await prisma.dealer.upsert({
        where: { id: String(d.id) },
        create: {
          id: String(d.id),
          status: String(d.status || "Pendente"),
          cnpj: String(d.cnpj),
          passwordHash: String(d.passwordHash || ""),
          companyName: String(d.companyName || ""),
          tradeName: String(d.tradeName || ""),
          contactName: String(d.contactName || ""),
          email: String(d.email || ""),
          phone: String(d.phone || ""),
          whatsapp: String(d.whatsapp || ""),
          state: String(d.state || ""),
          city: String(d.city || ""),
          createdAt: new Date(String(d.createdAt || Date.now())),
        },
        update: {
          status: String(d.status || "Pendente"),
          companyName: String(d.companyName || ""),
        },
      });
    } catch (e) {
      console.warn("  ! dealer skip", d.id, e);
    }
  }
  console.log("  ✓ revendedores");

  // Quotes
  const quotes = await readJson<Array<Record<string, unknown>>>(
    "orcamentos.json",
    [],
  );
  for (const q of quotes) {
    try {
      await prisma.quote.upsert({
        where: { id: String(q.id) },
        create: {
          id: String(q.id),
          number: String(q.number),
          status: String(q.status || "Novo"),
          responsible: String(q.responsible || ""),
          customer: (q.customer || {}) as Prisma.InputJsonValue,
          product: (q.product || {}) as Prisma.InputJsonValue,
          message: String(q.message || ""),
          attachments: (q.attachments || []) as Prisma.InputJsonValue,
          emailToCompany: Boolean(q.emailToCompany),
          emailToCustomer: Boolean(q.emailToCustomer),
          createdAt: new Date(String(q.createdAt || Date.now())),
        },
        update: { status: String(q.status || "Novo") },
      });
    } catch (e) {
      console.warn("  ! quote skip", q.id, e);
    }
  }
  console.log("  ✓ orçamentos");

  // Contacts
  const contacts = await readJson<Array<Record<string, unknown>>>(
    "contatos.json",
    [],
  );
  for (const m of contacts) {
    try {
      await prisma.contactMessage.upsert({
        where: { id: String(m.id) },
        create: {
          id: String(m.id),
          helpIntent: String(m.helpIntent || ""),
          name: String(m.name || ""),
          company: String(m.company || ""),
          document: String(m.document || ""),
          email: String(m.email || ""),
          phone: String(m.phone || ""),
          whatsapp: String(m.whatsapp || ""),
          city: String(m.city || ""),
          state: String(m.state || ""),
          subject: String(m.subject || ""),
          message: String(m.message || ""),
          createdAt: new Date(String(m.createdAt || Date.now())),
        },
        update: {},
      });
    } catch {
      /* skip */
    }
  }
  const contactSettings = await readJson<Record<string, unknown>>(
    "contato-settings.json",
    {},
  );
  if (Object.keys(contactSettings).length) {
    await prisma.contactSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        data: contactSettings as Prisma.InputJsonValue,
      },
      update: { data: contactSettings as Prisma.InputJsonValue },
    });
  }
  console.log("  ✓ contatos");

  // Media
  const media = await readJson<{ assets?: Array<Record<string, unknown>> }>(
    "media-library.json",
    {},
  );
  for (const a of media.assets || []) {
    try {
      await prisma.mediaAsset.upsert({
        where: { id: String(a.id) },
        create: {
          id: String(a.id),
          name: String(a.name || ""),
          originalName: String(a.originalName || a.name || ""),
          url: String(a.url),
          thumbUrl: String(a.thumbUrl || ""),
          webpUrl: a.webpUrl ? String(a.webpUrl) : null,
          mime: String(a.mime || ""),
          size: Number(a.size || 0),
          width: a.width ? Number(a.width) : null,
          height: a.height ? Number(a.height) : null,
          folder: String(a.folder || "geral"),
          usedIn: Array.isArray(a.usedIn) ? (a.usedIn as string[]) : [],
        },
        update: { name: String(a.name || "") },
      });
    } catch {
      /* skip */
    }
  }
  console.log("  ✓ mídias");

  // Coupons from CMS
  if (Array.isArray(cms.coupons)) {
    for (const c of cms.coupons as Array<Record<string, unknown>>) {
      await prisma.coupon.upsert({
        where: { id: String(c.id) },
        create: {
          id: String(c.id),
          code: String(c.code),
          discount: Number(c.discount || 0),
          active: c.active !== false,
        },
        update: {
          discount: Number(c.discount || 0),
          active: c.active !== false,
        },
      });
    }
  }
  console.log("  ✓ cupons");

  console.log("\n✓ Importação concluída. PostgreSQL é a fonte oficial.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
