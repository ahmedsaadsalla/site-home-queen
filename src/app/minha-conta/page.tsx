import type { Metadata } from "next";
import { AccountPageView } from "@/components/AccountPageView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";

export const metadata: Metadata = {
  title: "Minha Conta | Home Queen",
  description: "Área do cliente e portal do revendedor Home Queen.",
  robots: { index: false, follow: false },
};

export default function MinhaContaPage() {
  return (
    <main className="bg-[#F8F8F6]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <AccountPageView />
      <SiteFooter />
    </main>
  );
}
