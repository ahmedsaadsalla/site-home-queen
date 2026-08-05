"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";

export default function Page() {
  return (
    <AdminModuleStub
      title="Relatórios"
      subtitle="Vendas, estoque, clientes e financeiro"
      bullets={["Vendas por período", "Top produtos", "Clientes CPF x CNPJ", "Exportar CSV"]}
    />
  );
}
