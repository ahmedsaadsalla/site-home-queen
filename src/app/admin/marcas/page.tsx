"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";

export default function Page() {
  return (
    <AdminModuleStub
      title="Marcas"
      subtitle="Cadastro de marcas do catálogo"
      bullets={["Nome da marca", "Logo", "Descrição", "Visível no filtro"]}
    />
  );
}
