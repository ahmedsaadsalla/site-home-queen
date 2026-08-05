"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";

export default function Page() {
  return (
    <AdminModuleStub
      title="Garantias"
      subtitle="Solicitações de garantia"
      bullets={["Abrir chamado", "Status", "Peças", "Histórico do cliente"]}
    />
  );
}
