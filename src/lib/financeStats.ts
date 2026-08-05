import { prisma } from "@/lib/prisma";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Métricas financeiras / comerciais — reutiliza Order/Quote/Customer */
export async function getFinanceDashboard() {
  const today = startOfDay();
  const month = startOfMonth();

  const [
    ordersToday,
    ordersMonth,
    quotesTotal,
    quotesMonth,
    customersNew,
    ordersMonthRows,
    topItems,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: month } },
      select: { total: true, id: true },
    }),
    prisma.quote.count(),
    prisma.quote.count({ where: { createdAt: { gte: month } } }),
    prisma.customer.count({ where: { createdAt: { gte: month } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: month } },
      select: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
  ]);

  const monthRevenue = ordersMonthRows.reduce((a, o) => a + (o.total || 0), 0);
  const ticketMedio =
    ordersMonthRows.length > 0 ? monthRevenue / ordersMonthRows.length : 0;

  // Categorias mais “acessadas”: proxy por itens vendidos → produto → categoria
  const topProductIds = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 30,
  });

  const pids = topProductIds
    .map((t) => t.productId)
    .filter((id): id is string => Boolean(id));
  const products = await prisma.product.findMany({
    where: { id: { in: pids } },
    select: { id: true, categoryId: true, category: { select: { name: true } } },
  });
  const catMap = new Map<string, { name: string; qty: number }>();
  for (const t of topProductIds) {
    const p = products.find((x) => x.id === t.productId);
    if (!p) continue;
    const name = p.category?.name || "Sem categoria";
    const prev = catMap.get(p.categoryId) || { name, qty: 0 };
    prev.qty += t._sum.quantity || 0;
    catMap.set(p.categoryId, prev);
  }
  const topCategories = [...catMap.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  return {
    ordersToday,
    ordersMonth: ordersMonth.length,
    revenueMonth: monthRevenue,
    quotesTotal,
    quotesMonth,
    customersNew,
    ticketMedio,
    topProducts: topItems.map((t) => ({
      name: t.name,
      quantity: t._sum.quantity || 0,
    })),
    topCategories,
  };
}
