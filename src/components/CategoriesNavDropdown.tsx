"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChevron } from "@/components/icons";

const categories = [
  { id: "camas-box", label: "Camas Box" },
  { id: "camas-box-bau", label: "Camas Box Baú" },
  { id: "camas-com-colchao", label: "Camas com Colchão" },
  { id: "colchoes", label: "Colchões" },
  { id: "cabeceiras", label: "Cabeceiras" },
  { id: "bases", label: "Bases" },
  { id: "baus", label: "Baús" },
  { id: "acessorios", label: "Acessórios" },
] as const;

export function CategoriesNavDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("categoria");

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function goToCategory(categoryId: string) {
    setOpen(false);
    router.push(`/?categoria=${categoryId}#nosso-catalogo`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex items-center gap-1 uppercase transition hover:text-[#C8A96A] ${
          open ? "text-[#C8A96A]" : ""
        }`}
      >
        Categorias
        <IconChevron
          direction="down"
          className={`h-3.5 w-3.5 opacity-80 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+12px)] z-[90] w-[300px] rounded-[14px] border border-[#EAEAEA] bg-white p-3 shadow-[0_20px_50px_rgba(15,15,16,0.28)]"
        >
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0F0F10]">
            Categorias
          </p>
          <ul className="space-y-0.5">
            {categories.map((category) => {
              const active = activeCategory === category.id;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => goToCategory(category.id)}
                    className={`group flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium normal-case tracking-normal transition ${
                      active
                        ? "bg-[#C8A96A] text-black"
                        : "text-[#2E2E2E] hover:bg-[#F4EFE4] hover:text-[#0F0F10]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                        active ? "text-black" : "text-[#C5A059]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[18px] w-[18px]"
                        aria-hidden
                      >
                        <path
                          d="M3 10h18v8H3v-8zM5 10V7a2 2 0 012-2h10a2 2 0 012 2v3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="flex-1">{category.label}</span>
                    <IconChevron
                      direction="right"
                      className={`h-3.5 w-3.5 transition ${
                        active
                          ? "text-black/50"
                          : "text-[#B0B0B0] group-hover:text-[#C5A059]"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
