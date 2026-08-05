import { prisma } from "@/lib/prisma";
import {
  defaultAdminCms,
  type AdminCms,
  type AdminLog,
  type AdminOrder,
} from "@/data/admin";
import { assembleCms, iso } from "@/lib/db/mappers";
import { readCustomers } from "@/lib/customerStore";
import { readDealers } from "@/lib/wholesaleStore";
import { readQuotes } from "@/lib/quotesStore";
import type { Prisma } from "@prisma/client";

const CMS_KEYS = [
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
] as const;

async function loadSections(): Promise<Record<string, unknown>> {
  const rows = await prisma.cmsSection.findMany({
    where: { key: { in: [...CMS_KEYS] } },
  });
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.data;
  return map;
}

function orderFromDb(o: {
  id: string;
  createdAt: Date;
  customerName: string;
  customerType: string;
  total: number;
  status: string;
  payment: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}): AdminOrder {
  return {
    id: o.id,
    createdAt: iso(o.createdAt),
    customerName: o.customerName,
    customerType: (o.customerType as AdminOrder["customerType"]) || "Guest",
    total: o.total,
    status: o.status as AdminOrder["status"],
    payment: o.payment,
    items: o.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  };
}

export async function readAdminCms(): Promise<AdminCms> {
  try {
    const [sections, banners, coupons, orders, logs] = await Promise.all([
      loadSections(),
      prisma.banner.findMany({ orderBy: { order: "asc" } }),
      prisma.coupon.findMany({ orderBy: { code: "asc" } }),
      prisma.order.findMany({
        where: { source: "admin" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.adminLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    // Se banco vazio, aplica defaults na 1ª leitura
    if (Object.keys(sections).length === 0) {
      await seedCmsDefaults();
      return readAdminCms();
    }

    return assembleCms({
      sections,
      banners,
      coupons,
      orders: orders.map(orderFromDb),
      logs: logs.map((l) => ({
        id: l.id,
        createdAt: iso(l.createdAt),
        user: l.user,
        action: l.action,
        detail: l.detail,
      })),
    });
  } catch (e) {
    console.error("[readAdminCms]", e);
    return defaultAdminCms();
  }
}

async function seedCmsDefaults() {
  const base = defaultAdminCms();
  await Promise.all(
    CMS_KEYS.map((key) =>
      prisma.cmsSection.upsert({
        where: { key },
        create: {
          key,
          data: (base as unknown as Record<string, unknown>)[key] as Prisma.InputJsonValue,
        },
        update: {},
      }),
    ),
  );
  if ((await prisma.coupon.count()) === 0) {
    for (const c of base.coupons) {
      await prisma.coupon.create({
        data: {
          id: c.id,
          code: c.code,
          discount: c.discount,
          active: c.active,
        },
      });
    }
  }
}

export async function writeAdminCms(cms: AdminCms) {
  cms.updatedAt = new Date().toISOString();
  await prisma.$transaction(async (tx) => {
    for (const key of CMS_KEYS) {
      const data = (cms as unknown as Record<string, unknown>)[key];
      await tx.cmsSection.upsert({
        where: { key },
        create: { key, data: data as Prisma.InputJsonValue },
        update: { data: data as Prisma.InputJsonValue },
      });
    }

    // banners sync
    await tx.banner.deleteMany({});
    if (cms.banners?.length) {
      await tx.banner.createMany({
        data: cms.banners.map((b) => ({
          id: b.id,
          title: b.title || "",
          image: b.image || "",
          link: b.link || "",
          page: b.page || "home",
          order: b.order ?? 0,
          active: b.active !== false,
        })),
      });
    }

    // coupons sync
    await tx.coupon.deleteMany({});
    if (cms.coupons?.length) {
      await tx.coupon.createMany({
        data: cms.coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discount: c.discount,
          active: c.active,
        })),
      });
    }

    // admin orders sync (source=admin)
    await tx.orderItem.deleteMany({
      where: { order: { source: "admin" } },
    });
    await tx.order.deleteMany({ where: { source: "admin" } });
    for (const o of cms.orders || []) {
      await tx.order.create({
        data: {
          id: o.id,
          createdAt: new Date(o.createdAt),
          customerName: o.customerName,
          customerType: o.customerType,
          total: o.total,
          status: o.status,
          payment: o.payment || "",
          source: "admin",
          items: {
            create: (o.items || []).map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
      });
    }
  });
}

export async function appendAdminLog(
  action: string,
  detail: string,
  user = "Admin",
) {
  const { writeAuditLog } = await import("@/lib/audit");
  const log = await writeAuditLog(action, detail, { user });
  const result: AdminLog = {
    id: log.id,
    createdAt: iso(log.createdAt),
    user: log.user,
    action: log.action,
    detail: log.detail,
  };
  return result;
}

export async function getDashboardStats() {
  const [cms, customers, dealers, quotes, catalog, orderRows] =
    await Promise.all([
      readAdminCms(),
      readCustomers(),
      readDealers(),
      readQuotes(),
      (async () => {
        const { readAdminCatalog } = await import("@/lib/catalogAdminStore");
        return readAdminCatalog();
      })(),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

  const allOrders: AdminOrder[] = orderRows.map(orderFromDb);

  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = allOrders.filter((o) => o.createdAt.startsWith(today));
  const salesToday = ordersToday.reduce((s, o) => s + (o.total || 0), 0);
  const faturamento = allOrders
    .filter((o) => !["Cancelado", "Aguardando pagamento"].includes(o.status))
    .reduce((s, o) => s + (o.total || 0), 0);

  const products = catalog.products.filter((p) => !p.deletedAt);
  const categories = catalog.categories.filter((c) => !c.deletedAt && c.active);
  const lowStock = products
    .filter((p) => p.active && p.stock <= 8)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }));

  const pending = allOrders.filter((o) =>
    ["Aguardando pagamento", "Pago", "Em produção"].includes(o.status),
  ).length;
  const sent = allOrders.filter((o) => o.status === "Enviado").length;
  const delivered = allOrders.filter((o) => o.status === "Entregue").length;

  return {
    pedidosHoje: ordersToday.length,
    vendasHoje: salesToday,
    faturamento,
    orcamentos: quotes.length,
    clientesCpf: customers.length,
    clientesCnpj: dealers.length,
    produtos: products.length,
    categorias: categories.length,
    estoque: products.length,
    produtosFalta: lowStock.length,
    pedidosPendentes: pending,
    pedidosEnviados: sent,
    pedidosEntregues: delivered,
    ultimosPedidos: allOrders.slice(0, 8),
    ultimosClientes: customers
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
      })),
    ultimosCnpj: dealers.slice(0, 5).map((d) => ({
      id: d.id,
      name: d.tradeName || d.companyName,
      status: d.status,
      cnpj: d.cnpj,
    })),
    ultimosOrcamentos: [...quotes]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((q) => ({
        id: q.id,
        number: q.number,
        customer: q.customer.name || q.customer.company || "Cliente",
        status: q.status,
        product: q.product.name,
        createdAt: q.createdAt,
      })),
    lowStock,
    salesChart: buildSalesChart(allOrders),
  };
}

function buildSalesChart(orders: AdminOrder[]) {
  const days: Array<{ label: string; value: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const value = orders
      .filter((o) => o.createdAt.startsWith(key))
      .reduce((s, o) => s + (o.total || 0), 0);
    days.push({ label, value });
  }
  return days;
}
