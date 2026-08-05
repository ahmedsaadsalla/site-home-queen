"use client";

import { ReactNode } from "react";

export function AdminModal({
  open,
  title,
  children,
  onClose,
  wide = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal
        className={`max-h-[90vh] w-full overflow-auto rounded-2xl border border-white/15 bg-[#151515] p-5 shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-[#F8F8F6]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-[12px] text-white/60 hover:border-[#C8A96A] hover:text-[#C8A96A]"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
