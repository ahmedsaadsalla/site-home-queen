"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    if (!token) {
      setError("Link inválido.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Não foi possível redefinir.");
        return;
      }
      setOk(data.message || "Senha atualizada.");
      window.setTimeout(() => router.replace("/admin/login"), 1400);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151515] p-7">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8A96A]">
        Home Queen
      </p>
      <h1 className="font-display mt-2 text-[28px]">Nova senha</h1>
      <p className="mt-2 text-[14px] text-white/50">
        Defina uma nova senha para acessar o painel.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
            Nova senha
          </span>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/12 bg-[#0F0F10] px-4 py-3 text-[14px]"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
            Confirmar senha
          </span>
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-white/12 bg-[#0F0F10] px-4 py-3 text-[14px]"
          />
        </div>
        {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
        {ok ? <p className="text-[13px] text-[#C8A96A]">{ok}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-[#C8A96A] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar nova senha"}
        </button>
        <p className="text-center text-[13px]">
          <Link href="/admin/login" className="text-white/50 hover:text-[#C8A96A]">
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0C] px-4 text-[#F8F8F6]">
      <Suspense fallback={<p className="text-white/50">Carregando…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
