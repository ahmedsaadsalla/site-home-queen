"use client";

import {
  IconBadge,
  IconFactory,
  IconTruck,
  IconWhatsApp,
} from "@/components/icons";

export function TopBar() {
  return (
    <div className="w-full border-b border-white/5 bg-[#171717] text-[#C8A96A]">
      <div className="flex h-10 w-full items-center justify-between gap-4 overflow-hidden px-4 text-[11px] uppercase tracking-[0.12em] sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <IconTruck className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Entrega para todo Brasil</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
            <IconFactory className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Fábrica própria</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 md:inline-flex">
            <IconBadge className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Qualidade premium</span>
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-4 sm:gap-5">
          <a
            href="tel:+5549999999999"
            className="hidden items-center gap-1.5 transition hover:text-[#d4b87a] sm:inline-flex"
          >
            <span className="font-medium">Telefone</span>
            <span className="normal-case tracking-normal text-[#C8A96A]/90">
              (49) 99999-9999
            </span>
          </a>
          <a
            href="https://wa.me/5549999999999"
            className="inline-flex items-center gap-1.5 transition hover:text-[#d4b87a]"
          >
            <IconWhatsApp className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden font-medium sm:inline">WhatsApp</span>
            <span className="normal-case tracking-normal text-[#C8A96A]/90">
              (49) 99999-9999
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
