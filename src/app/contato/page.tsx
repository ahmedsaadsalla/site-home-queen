import type { Metadata } from "next";
import { ContactPageView } from "@/components/ContactPageView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { readAdminCms } from "@/lib/adminStore";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await readAdminCms();
  return buildPageMetadata({
    page: cms.seo.contact,
    fallbackTitle: "Contato | Home Queen",
    fallbackDescription:
      "Fale com a Home Queen — atendimento premium para varejo e atacado. Formulário, WhatsApp e FAQ.",
    fallbackPath: "/contato",
  });
}

export default function ContatoPage() {
  return (
    <main className="bg-[#F5F5F3]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <ContactPageView />
      <SiteFooter />
    </main>
  );
}
