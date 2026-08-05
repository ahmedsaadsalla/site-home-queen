"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const [identity, setIdentity] = useState("");
  const [msg, setMsg] = useState("");
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setDevLink("");
    if (!identity.trim()) {
      setError("Informe o e-mail ou usuário.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identity }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        devLink?: string;
      };
      if (!res.ok) {
        setError(data.error || "Falha ao processar.");
        return;
      }
      setMsg(
        data.message ||
          "Se o cadastro existir, enviamos um link de redefinição.",
      );
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0C] px-4 text-[#F8F8F6]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151515] p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8A96A]">
          Home Queen
        </p>
        <h1 className="font-display mt-2 text-[28px]">Esqueci minha senha</h1>
        <p className="mt-2 text-[14px] text-white/50">
          Informe o usuário ou e-mail. Enviaremos um link de redefinição.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
              Usuário ou e-mail
            </span>
            <input
              className="w-full rounded-xl border border-white/12 bg-[#0F0F10] px-4 py-3 text-[14px] outline-none focus:border-[#C8A96A]/70"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="admin@homequeen"
            />
          </label>
          {error ? (
            <p className="text-[13px] text-red-300">{error}</p>
          ) : null}
          {msg ? (
            <p className="text-[13px] text-[#C8A96A]">{msg}</p>
          ) : null}
          {devLink ? (
            <p className="break-all text-[12px] text-white/45">
              Link de teste (dev):{" "}
              <a href={devLink} className="text-[#C8A96A] underline">
                {devLink}
              </a>
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#C8A96A] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] disabled:opacity-60"
          >
            {busy ? "Enviando…" : "Enviar link"}
          </button>
          <p className="text-center text-[13px]">
            <Link href="/admin/login" className="text-white/50 hover:text-[#C8A96A]">
              Voltar ao login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
