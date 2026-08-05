"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn, adminInput, adminLabel } from "@/components/admin/AdminCmsForm";
import { PasswordInput } from "@/components/PasswordInput";
import type { AdminRole } from "@/lib/adminSession";

type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: string | null;
};

const roles: AdminRole[] = [
  "Administrador",
  "Gerente",
  "Comercial",
  "Financeiro",
  "Produção",
  "Atendimento",
];

const empty = () => ({
  id: "",
  name: "",
  username: "",
  email: "",
  password: "",
  role: "Atendimento" as AdminRole,
  active: true,
});

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState(empty());
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setError("Sem permissão para gerenciar usuários.");
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setMsg("");
    setError("");
    if (!form.name.trim() || !form.username.trim() || !form.email.trim()) {
      setError("Preencha nome, usuário e e-mail.");
      return;
    }
    if (!form.id && form.password.length < 6) {
      setError("Senha obrigatória (mín. 6 caracteres) para novo usuário.");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: form.id || undefined,
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password || undefined,
        role: form.role,
        active: form.active,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao salvar.");
      return;
    }
    setMsg(form.id ? "Usuário atualizado." : "Usuário criado.");
    setForm(empty());
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este usuário?")) return;
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Não foi possível excluir.");
      return;
    }
    setMsg("Usuário excluído.");
    await load();
  }

  return (
    <AdminShell
      title="Usuários"
      subtitle="Crie administradores com cargo e permissões por perfil"
    >
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#151515] p-5 lg:grid-cols-2">
        <label>
          <span className={adminLabel}>Nome</span>
          <input
            className={adminInput}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          <span className={adminLabel}>Usuário</span>
          <input
            className={adminInput}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </label>
        <label>
          <span className={adminLabel}>E-mail</span>
          <input
            className={adminInput}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          <span className={adminLabel}>Cargo</span>
          <select
            className={adminInput}
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as AdminRole })
            }
          >
            {roles.map((r) => (
              <option key={r} value={r} className="bg-[#0F0F10]">
                {r}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className={adminLabel}>
            Senha {form.id ? "(deixe em branco para manter)" : ""}
          </span>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={adminInput}
          />
        </div>
        <label className="flex items-center gap-2 pt-6 text-[13px] text-white/70">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="accent-[#C8A96A]"
          />
          Status ativo
        </label>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <button type="button" className={adminBtn} onClick={() => void save()}>
            {form.id ? "Salvar alterações" : "Criar usuário"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-2 text-[12px]"
              onClick={() => setForm(empty())}
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
        {msg ? <p className="text-[13px] text-[#C8A96A] lg:col-span-2">{msg}</p> : null}
        {error ? <p className="text-[13px] text-red-300 lg:col-span-2">{error}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="bg-white/5 text-[11px] uppercase text-white/45">
            <tr>
              <th className="px-3 py-3">Nome</th>
              <th className="px-3 py-3">Usuário</th>
              <th className="px-3 py-3">E-mail</th>
              <th className="px-3 py-3">Cargo</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/8">
                <td className="px-3 py-3">{u.name}</td>
                <td className="px-3 py-3">{u.username}</td>
                <td className="px-3 py-3 text-white/60">{u.email}</td>
                <td className="px-3 py-3">{u.role}</td>
                <td className="px-3 py-3">
                  {u.active ? (
                    <span className="text-emerald-300">Ativo</span>
                  ) : (
                    <span className="text-white/40">Inativo</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    className="mr-2 text-[#C8A96A]"
                    onClick={() =>
                      setForm({
                        id: u.id,
                        name: u.name,
                        username: u.username,
                        email: u.email,
                        password: "",
                        role: u.role,
                        active: u.active,
                      })
                    }
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-red-300"
                    onClick={() => void remove(u.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
