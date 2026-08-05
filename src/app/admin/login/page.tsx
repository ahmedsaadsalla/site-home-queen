"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Usuário ou senha inválidos.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Usuário ou senha inválidos.");
        return;
      }
      const next = searchParams.get("next") || "/admin";
      const safe =
        next.startsWith("/admin") && !next.startsWith("/admin/login")
          ? next
          : "/admin";
      router.replace(safe);
      router.refresh();
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151515] p-7 shadow-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8A96A]">
        Home Queen
      </p>
      <h1 className="font-display mt-2 text-[30px]">Painel administrativo</h1>
      <p className="mt-2 text-[14px] text-white/50">
        Informe seu usuário e senha para continuar. Campos obrigatórios.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
            Usuário *
          </span>
          <input
            type="text"
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin@homequeen"
            className="w-full rounded-xl border border-white/12 bg-[#0F0F10] px-4 py-3 text-[14px] outline-none focus:border-[#C8A96A]/70"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
            Senha *
          </span>
          <PasswordInput
            name="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/12 bg-[#0F0F10] px-4 py-3 pr-12 text-[14px] outline-none focus:border-[#C8A96A]/70"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-[#C8A96A] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F] disabled:opacity-60"
        >
          {busy ? "Entrando…" : "Entrar no painel"}
        </button>

        <p className="text-center">
          <Link
            href="/admin/login/recuperar"
            className="text-[13px] text-[#C8A96A] transition hover:underline"
          >
            Esqueci minha senha
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0C] px-4 text-[#F8F8F6]">
      <Suspense fallback={<p className="text-white/50">Carregando…</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
