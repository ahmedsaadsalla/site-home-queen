"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";

export default function Page() {
  return (
    <AdminModuleStub
      title="Avaliações"
      subtitle="Moderação de avaliações de produtos"
      bullets={["Aprovar/reprovar", "Nota média", "Resposta da loja", "Destaque"]}
    />
  );
}
