"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EditContentPanel } from "@/components/admin/EditContentPanel";
import { ImageField } from "@/components/admin/ImageField";
import { adminBtn, adminInput, adminLabel } from "@/components/admin/AdminCmsForm";
import type { SiteBanner } from "@/data/admin";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setBanners(cms.banners || []));
  }, []);

  async function save(next: SiteBanner[]) {
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "banners",
        data: next,
        action: "Banners",
        detail: "Banners do site atualizados",
      }),
    });
    if (res.ok) {
      setBanners(next);
      setMsg("Banners salvos.");
    } else setMsg("Erro ao salvar.");
  }

  function add() {
    void save([
      ...banners,
      {
        id: `bn_${Date.now().toString(36)}`,
        title: "Novo banner",
        image: "",
        link: "/",
        page: "home",
        order: banners.length + 1,
        active: true,
      },
    ]);
  }

  return (
    <AdminShell
      title="Banners"
      subtitle="Banners de campanha (slides do Hero ficam em Home)"
    >
      <EditContentPanel title="Gerenciar banners" defaultOpen>
        <p className="text-[12px] text-white/45">
          Para o slider principal da Home, use Site → Home → Banner Slider.
          Aqui ficam banners promocionais por página.
        </p>
        <button type="button" className={`${adminBtn} mt-3`} onClick={add}>
          Adicionar banner
        </button>
      </EditContentPanel>

      <div className="space-y-4">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="rounded-2xl border border-white/10 bg-[#151515] p-4"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
              <div className="space-y-3">
                <label>
                  <span className={adminLabel}>Título</span>
                  <input
                    className={adminInput}
                    value={b.title}
                    onChange={(e) =>
                      setBanners((prev) =>
                        prev.map((x) =>
                          x.id === b.id ? { ...x, title: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  <span className={adminLabel}>Link</span>
                  <input
                    className={adminInput}
                    value={b.link}
                    onChange={(e) =>
                      setBanners((prev) =>
                        prev.map((x) =>
                          x.id === b.id ? { ...x, link: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  <span className={adminLabel}>Página</span>
                  <input
                    className={adminInput}
                    value={b.page}
                    onChange={(e) =>
                      setBanners((prev) =>
                        prev.map((x) =>
                          x.id === b.id ? { ...x, page: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={b.active}
                    onChange={(e) =>
                      setBanners((prev) =>
                        prev.map((x) =>
                          x.id === b.id ? { ...x, active: e.target.checked } : x,
                        ),
                      )
                    }
                    className="accent-[#C8A96A]"
                  />
                  Ativo
                </label>
              </div>
              <ImageField
                label={`Banner ${i + 1}`}
                value={b.image}
                onChange={(url) =>
                  setBanners((prev) =>
                    prev.map((x) => (x.id === b.id ? { ...x, image: url } : x)),
                  )
                }
                folder="banners"
                usedIn={`Banner · ${b.title}`}
              />
            </div>
            <button
              type="button"
              className="mt-3 text-[12px] text-red-300"
              onClick={() => void save(banners.filter((x) => x.id !== b.id))}
            >
              Excluir banner
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          className={adminBtn}
          onClick={() => void save(banners)}
        >
          Salvar banners
        </button>
        {msg ? <p className="text-[13px] text-[#C8A96A]">{msg}</p> : null}
      </div>
    </AdminShell>
  );
}
