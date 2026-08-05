import type { ReactNode } from "react";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function SiteBreadcrumb({
  items,
  className = "",
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-[12px] text-[#0F0F10]/55 ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? (
                <span className="text-[#C8A96A]/80" aria-hidden>
                  {">"}
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition hover:text-[#C8A96A]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-[#0F0F10]/80" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Wrapper de imagem SEO — alt, title e lazy por padrão (exceto priority). */
export function SeoImageProps(
  alt: string,
  opts?: { title?: string; priority?: boolean; loading?: "lazy" | "eager" },
) {
  return {
    alt: alt || "Home Queen",
    title: opts?.title || alt || "Home Queen",
    ...(opts?.priority
      ? { priority: true as const }
      : { loading: (opts?.loading || "lazy") as "lazy" }),
  };
}

export function SeoScoreBadge({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: "green" | "yellow" | "red";
}) {
  const dot =
    color === "green"
      ? "bg-emerald-400"
      : color === "yellow"
        ? "bg-amber-400"
        : "bg-red-400";
  const text =
    color === "green"
      ? "text-emerald-300"
      : color === "yellow"
        ? "text-amber-300"
        : "text-red-300";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-semibold ${text}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      SEO {score}% · {label}
    </span>
  );
}

// silence unused ReactNode if tree-shaken
void (0 as unknown as ReactNode);
