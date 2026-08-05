import { redirect } from "next/navigation";

/** Evita duplicar UI — Versão aponta para Atualizações */
export default function SistemaVersaoRedirect() {
  redirect("/admin/sistema/atualizacoes");
}
