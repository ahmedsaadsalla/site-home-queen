"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  SiteField,
  SiteSaveBar,
  siteInput,
} from "@/components/admin/SiteEditor";
import type { HomeCms, SiteStatItem } from "@/data/admin";

const ICON_OPTIONS: Array<{ value: SiteStatItem["icon"]; label: string }> = [
  { value: "users", label: "Clientes (pessoas)" },
  { value: "package", label: "Produtos (caixa)" },
  { value: "truck", label: "Entregas (caminhão)" },
  { value: "badge", label: "Anos (estrela)" },
  { value: "stars", label: "Satisfação (estrelas)" },
];

export default function AdminNumbersPage() {
  const [home, setHome] = useState<HomeCms | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setHome(cms.home));
  }, []);

  async function save() {
    if (!home) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "home",
          data: home,
          action: "Números do site",
          detail: "Indicadores da home atualizados",
        }),
      });
      if (!res.ok) throw new Error("fail");
      setMsg("Números salvos. Já aparecem no site.");
    } catch {
      setMsg("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  function patchStat(id: string, patch: Partial<SiteStatItem>) {
    if (!home) return;
    setHome({
      ...home,
      stats: (home.stats || []).map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    });
  }

  if (!home) {
    return (
      <AdminShell title="Números">
        <p className="text-white/50">Carregando…</p>
      </AdminShell>
    );
  }

  const stats = home.stats || [];

  return (
    <AdminShell
      title="Editar números"
      subtitle="Os indicadores da home (Clientes, Produtos, Entregas…)"
    >
      <Link
        href="/admin/site"
        className="mb-4 inline-block text-[12px] text-white/45 hover:text-[#C8A96A]"
      >
        ← Todas as páginas
      </Link>

      <div className="max-w-3xl space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
          <SiteField
            label="Título da seção"
            help='Ex.: "Nossos números falam por nós"'
          >
            <input
              className={siteInput}
              value={home.statsTitle || ""}
              onChange={(e) => setHome({ ...home, statsTitle: e.target.value })}
            />
          </SiteField>
        </div>

        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className="rounded-2xl border border-white/10 bg-[#151515] p-5"
          >
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8A96A]">
              Indicador {index + 1}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SiteField label="Número (valor)">
                <input
                  type="number"
                  className={siteInput}
                  value={stat.value}
                  onChange={(e) =>
                    patchStat(stat.id, {
                      value: Number(e.target.value) || 0,
                    })
                  }
                />
              </SiteField>
              <SiteField
                label="Símbolo depois do número"
                help='Ex.: + ou %  (fica 15.000+ ou 98%)'
              >
                <input
                  className={siteInput}
                  value={stat.suffix}
                  onChange={(e) =>
                    patchStat(stat.id, { suffix: e.target.value })
                  }
                />
              </SiteField>
              <SiteField label="Texto embaixo do número">
                <input
                  className={siteInput}
                  value={stat.label}
                  onChange={(e) =>
                    patchStat(stat.id, { label: e.target.value })
                  }
                />
              </SiteField>
              <SiteField label="Ícone">
                <select
                  className={siteInput}
                  value={stat.icon}
                  onChange={(e) =>
                    patchStat(stat.id, {
                      icon: e.target.value as SiteStatItem["icon"],
                    })
                  }
                >
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0F0F10]">
                      {o.label}
                    </option>
                  ))}
                </select>
              </SiteField>
            </div>
            <p className="mt-3 text-[13px] text-white/40">
              Prévia:{" "}
              <span className="font-semibold text-[#C8A96A]">
                {stat.value.toLocaleString("pt-BR")}
                {stat.suffix}
              </span>{" "}
              — {stat.label}
            </p>
          </div>
        ))}
      </div>

      <SiteSaveBar
        onSave={() => void save()}
        busy={busy}
        msg={msg}
        previewHref="/#numeros"
      />
    </AdminShell>
  );
}
