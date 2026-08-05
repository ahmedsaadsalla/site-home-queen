"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sid() {
  try {
    const k = "hq_vid";
    let v = localStorage.getItem(k);
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return null;
  }
}

/** Beacon leve de pageview (não altera layout da loja) */
export function SiteAnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const productMatch = pathname.match(/\/produto\/([^/]+)/);
    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId: sid(),
        productSlug: productMatch?.[1] || null,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
