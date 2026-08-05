import type { ReactNode } from "react";
import { AdminToastProvider } from "@/components/admin/AdminToast";

export const metadata = {
  title: "Painel Administrativo | Home Queen",
  description: "Controle total do site, loja, atacado e integrações Home Queen.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminToastProvider>{children}</AdminToastProvider>;
}
