"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { IconSearch } from "@/components/icons";
import { formatBRL } from "@/data/homeCatalog";
import {
  searchSite,
} from "@/lib/searchIndex";

export function HeaderSearch({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchSite(query), [query]);
  const hasQuery = query.trim().length > 0;
  const empty = hasQuery && results.products.length === 0;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function goProduct(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/produtos/${id}`);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label
        className={`flex h-10 w-full items-center gap-2 rounded-full border bg-white px-3 transition duration-200 md:w-[180px] lg:w-[220px] ${
          open
            ? "border-[#C8A96A] shadow-[0_0_0_3px_rgba(200,169,106,0.18)]"
            : "border-[#E5E5E5] hover:border-[#C8A96A]"
        }`}
      >
        <IconSearch className="h-4 w-4 shrink-0 text-[#C8A96A]" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar produtos..."
          className="h-full w-full bg-transparent text-[13px] text-[#0F0F10] outline-none placeholder:text-[#9A9A9A]"
          aria-label="Buscar produtos"
          autoComplete="off"
        />
      </label>

      <AnimatePresence>
        {open && hasQuery ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[min(380px,calc(100vw-1.5rem))] overflow-hidden rounded-[14px] border border-[#EAEAEA] bg-white shadow-[0_18px_40px_rgba(15,15,16,0.16)]"
          >
            {empty ? (
              <div className="p-4">
                <p className="text-[14px] font-semibold text-[#0F0F10]">
                  Nenhum produto encontrado.
                </p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto py-2">
                <div className="px-3 pt-1">
                  <ul className="space-y-1">
                    {results.products.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => goProduct(product.id)}
                          className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left transition hover:bg-[#F8F5EE]"
                        >
                          <span className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[10px] bg-[#F5F5F3]">
                            <Image
                              src={product.image}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="60px"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[#0F0F10]">
                              {product.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-[#8A8A8A]">
                              {product.categoryLabel}
                              {product.stock !== undefined
                                ? ` · Estoque ${product.stock}`
                                : ""}
                            </span>
                            <span className="mt-0.5 block text-[13px] font-semibold text-[#0F0F10]">
                              {formatBRL(product.price)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
