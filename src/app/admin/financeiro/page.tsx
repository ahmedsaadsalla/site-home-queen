"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";

export default function Page() {
  return (
    <AdminModuleStub
      title="Financeiro"
      subtitle="PIX, cartão, boletos, NFs e fluxo de caixa"
      bullets={["Recebimentos do dia", "Notas fiscais", "Fluxo de caixa", "Relatórios"]}
    />
  );
}
