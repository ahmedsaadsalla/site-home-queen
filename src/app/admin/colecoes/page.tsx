"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";

export default function Page() {
  return (
    <AdminModuleStub
      title="Coleções"
      subtitle="Linhas e coleções sazonais"
      bullets={["Nome", "Banner", "Produtos vinculados", "Período de vigência"]}
    />
  );
}
