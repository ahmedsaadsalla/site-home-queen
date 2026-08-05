"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn } from "@/components/admin/AdminCmsForm";

type Issue = {
  type: string;
  severity: string;
  message: string;
  count: number;
  sampleIds?: string[];
};

type Report = {
  id: string;
  status: string;
  summary: string;
  issues: Issue[];
  checkedAt: string;
  createdAt: string;
};

export default function SistemaIntegridadePage() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/system/integrity")
      .then((r) => r.json())
      .then((d) => setReport(d.report));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/system/integrity", { method: "POST" });
      const data = await res.json();
      setReport(data.report);
    } finally {
      setBusy(false);
    }
  }

  const issues = (report?.issues || []) as Issue[];

  return (
    <AdminShell
      title="Integridade do banco"
      subtitle="Órfãos, duplicados, FKs e imagens · cron diário /api/cron/integrity"
    >
      <button
        type="button"
        className={adminBtn}
        disabled={busy}
        onClick={() => void run()}
      >
        {busy ? "Verificando…" : "Executar verificação"}
      </button>

      {!report ? (
        <p className="mt-6 text-white/40">Nenhum relatório ainda.</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
            <p className="text-[11px] uppercase tracking-wide text-white/40">
              Status ·{" "}
              {new Date(report.checkedAt || report.createdAt).toLocaleString(
                "pt-BR",
              )}
            </p>
            <p className="mt-2 text-[22px] font-semibold text-[#C8A96A]">
              {report.status}
            </p>
            <p className="mt-1 text-[13px] text-white/70">{report.summary}</p>
          </div>
          {issues.map((i) => (
            <div
              key={i.type}
              className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]"
            >
              <p className="font-semibold text-white/90">
                {i.message}{" "}
                <span className="text-white/40">({i.count})</span>
              </p>
              <p className="mt-1 text-[11px] text-white/40">
                {i.type} · {i.severity}
              </p>
              {i.sampleIds?.length ? (
                <p className="mt-1 break-all text-[11px] text-white/35">
                  Ex.: {i.sampleIds.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
