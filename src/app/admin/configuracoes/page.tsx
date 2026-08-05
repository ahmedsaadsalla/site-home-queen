"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { PageMediaEditor } from "@/components/admin/PageMediaEditor";

export default function AdminConfigPage() {
  return (
    <AdminShell
      title="Rodapé, login e áreas fixas"
      subtitle="Cada página/área com seus campos de imagem separados"
    >
      <div className="space-y-4">
        <PageMediaEditor
          pageKey="footer"
          folder="rodape"
          slots={["logo", "footerBg", "socialIconPack", "background"]}
          title="Rodapé · imagens"
        />
        <PageMediaEditor
          pageKey="login"
          folder="login"
          slots={["logo", "sideBanner", "background"]}
          title="Login · imagens"
        />
        <PageMediaEditor
          pageKey="register"
          folder="cadastro"
          slots={["banner", "sideBanner"]}
          title="Cadastro · imagens"
        />
        <PageMediaEditor
          pageKey="cart"
          folder="carrinho"
          slots={["banner"]}
          title="Carrinho · imagens"
        />
        <PageMediaEditor
          pageKey="favorites"
          folder="favoritos"
          slots={["banner"]}
          title="Favoritos · imagens"
        />
      </div>
    </AdminShell>
  );
}
