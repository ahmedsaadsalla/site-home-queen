import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export async function trackSiteView(opts: {
  path: string;
  referrer?: string | null;
  productId?: string | null;
  sessionId?: string | null;
  ip?: string | null;
}) {
  const path = (opts.path || "/").slice(0, 500);
  if (path.startsWith("/admin") || path.startsWith("/api")) return null;

  return prisma.siteView.create({
    data: {
      path,
      referrer: opts.referrer?.slice(0, 500) || null,
      productId: opts.productId || null,
      sessionId: opts.sessionId?.slice(0, 80) || null,
      ip: opts.ip?.slice(0, 80) || null,
    },
  });
}

export async function getAnalyticsDashboard() {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS);

  const [
    visitors24h,
    visitors30d,
    online,
    topPages,
    topProducts,
    topReferrers,
    orders30d,
    views30d,
    integrationsRow,
  ] = await Promise.all([
    prisma.siteView.groupBy({
      by: ["sessionId"],
      where: { createdAt: { gte: since24h } },
    }),
    prisma.siteView.count({ where: { createdAt: { gte: since30d } } }),
    prisma.siteView.groupBy({
      by: ["sessionId"],
      where: { createdAt: { gte: onlineSince }, sessionId: { not: null } },
    }),
    prisma.siteView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since30d } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.siteView.groupBy({
      by: ["productId"],
      where: {
        createdAt: { gte: since30d },
        productId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),
    prisma.siteView.groupBy({
      by: ["referrer"],
      where: {
        createdAt: { gte: since30d },
        referrer: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 8,
    }),
    prisma.order.count({ where: { createdAt: { gte: since30d } } }),
    prisma.siteView.count({ where: { createdAt: { gte: since30d } } }),
    prisma.cmsSection.findUnique({ where: { key: "integrations" } }),
  ]);

  const integrations = (integrationsRow?.data || {}) as {
    analytics?: { enabled?: boolean; measurementId?: string };
  };
  const gaId =
    integrations.analytics?.measurementId || env.googleAnalyticsId || "";
  const gaEnabled = Boolean(
    integrations.analytics?.enabled || env.googleAnalyticsId,
  );

  const productIds = topProducts
    .map((p) => p.productId)
    .filter((id): id is string => Boolean(id));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const conversion =
    views30d > 0 ? Number(((orders30d / views30d) * 100).toFixed(2)) : 0;

  return {
    visitors24h: visitors24h.filter((v) => v.sessionId).length || visitors24h.length,
    pageviews30d: visitors30d,
    usersOnline: online.filter((v) => v.sessionId).length,
    topPages: topPages.map((p) => ({
      path: p.path,
      views: p._count._all,
    })),
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      name:
        products.find((x) => x.id === p.productId)?.name || p.productId || "—",
      views: p._count._all,
    })),
    trafficSources: topReferrers.map((r) => ({
      referrer: r.referrer || "(direto)",
      views: r._count._all,
    })),
    conversionRate: conversion,
    orders30d,
    googleAnalytics: {
      enabled: gaEnabled,
      measurementId: gaId,
      propertyUrl: gaId
        ? `https://analytics.google.com/analytics/web/`
        : null,
    },
  };
}
