"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";

export default function Page() {
  return (
    <AdminModuleStub
      title="Transportadoras"
      subtitle="Frete e transportadoras"
      bullets={["Cadastro de transportadoras", "Prazos", "Tabelas de frete", "Rastreio"]}
    />
  );
}
