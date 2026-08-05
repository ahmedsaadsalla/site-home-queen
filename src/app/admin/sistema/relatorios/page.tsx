"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn } from "@/components/admin/AdminCmsForm";

type Report = {
  generatedAt: string;
  backup: Record<string, unknown>;
  integrity: { status: string; summary: string; checkedAt: string | null };
  security: Record<string, unknown>;
  database: Record<string, unknown>;
  storage: { used: string; free: string; percent: number };
  smtp: string;
  bling: string;
  version: string;
  environment: string;
};

export default function SistemaRelatoriosPage() {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/api/admin/system/reports")
      .then((r) => r.json())
      .then(setReport);
  }, []);

  return (
    <AdminShell
      title="Relatórios do sistema"
      subtitle="Backup, integridade, segurança, banco, espaço, SMTP e Bling"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["CSV", "csv"],
          ["Excel", "xlsx"],
          ["PDF", "pdf"],
        ].map(([label, fmt]) => (
          <a
            key={fmt}
            href={`/api/admin/system/reports?format=${fmt}`}
            className="rounded-full border border-[#C8A96A]/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#C8A96A] hover:bg-[#C8A96A]/10"
          >
            Exportar {label}
          </a>
        ))}
        <button
          type="button"
          className={adminBtn}
          onClick={() =>
            fetch("/api/admin/system/reports")
              .then((r) => r.json())
              .then(setReport)
          }
        >
          Atualizar
        </button>
      </div>

      {!report ? (
        <p className="text-white/40">Carregando…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            ["Backup", report.backup],
            ["Integridade", report.integrity],
            ["Segurança", report.security],
            ["Banco", report.database],
            ["Espaço", report.storage],
            ["SMTP / Bling", { smtp: report.smtp, bling: report.bling }],
          ].map(([title, obj]) => (
            <div
              key={String(title)}
              className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px]"
            >
              <h3 className="font-semibold text-[#C8A96A]">{title as string}</h3>
              <dl className="mt-3 space-y-1 text-white/70">
                {Object.entries(obj as Record<string, unknown>).map(
                  ([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-white/40">{k}</dt>
                      <dd className="text-right break-all">
                        {v == null
                          ? "—"
                          : typeof v === "object"
                            ? JSON.stringify(v)
                            : String(v)}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
