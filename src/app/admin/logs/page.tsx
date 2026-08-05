"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminLog } from "@/data/admin";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);

  useEffect(() => {
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setLogs(cms.logs || []));
  }, []);

  return (
    <AdminShell title="Logs" subtitle="Login, edições, pedidos, estoque e preços">
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-[14px] text-white/45">Nenhum log ainda.</p>
        ) : (
          logs.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]"
            >
              <p className="font-semibold text-[#C8A96A]">{l.action}</p>
              <p className="text-white/80">{l.detail}</p>
              <p className="mt-1 text-[11px] text-white/40">
                {l.user} · {new Date(l.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
