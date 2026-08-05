"use client";

import { AdminModuleStub } from "@/components/admin/AdminModuleStub";
import { EditContentPanel } from "@/components/admin/EditContentPanel";
import { ImageField } from "@/components/admin/ImageField";
import { useState } from "react";

export default function Page() {
  const [featured, setFeatured] = useState("");
  const [gallery, setGallery] = useState("");
  const [banner, setBanner] = useState("");

  return (
    <AdminModuleStub
      title="Blog"
      subtitle="Artigos, categorias, SEO e imagens"
      bullets={["Criar artigo", "Categorias", "SEO por post", "Moderar comentários"]}
      extra={
        <EditContentPanel title="Imagens do post (modelo)">
          <div className="grid gap-4 lg:grid-cols-2">
            <ImageField
              label="Imagem destacada"
              value={featured}
              onChange={setFeatured}
              folder="blog"
              usedIn="Blog · Destaque"
            />
            <ImageField
              label="Banner interno"
              value={banner}
              onChange={setBanner}
              folder="blog"
              usedIn="Blog · Banner"
            />
            <ImageField
              label="Galeria (primeira foto)"
              value={gallery}
              onChange={setGallery}
              folder="blog"
              usedIn="Blog · Galeria"
            />
          </div>
        </EditContentPanel>
      }
    />
  );
}
