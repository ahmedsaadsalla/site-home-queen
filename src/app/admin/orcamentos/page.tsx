"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminQuotesView } from "@/components/AdminQuotesView";

export default function AdminOrcamentosPage() {
  return (
    <AdminShell
      title="Orçamentos"
      subtitle="Visualizar, atribuir e transformar em pedido"
    >
      <div className="rounded-2xl border border-white/10 bg-[#F8F8F6] text-[#0F0F10]">
        <AdminQuotesView />
      </div>
    </AdminShell>
  );
}
