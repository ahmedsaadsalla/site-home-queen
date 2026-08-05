import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { WholesalePageView } from "@/components/WholesalePageView";
import { readAdminCms } from "@/lib/adminStore";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await readAdminCms();
  return buildPageMetadata({
    page: cms.seo.wholesale,
    fallbackTitle: "Revenda Home Queen",
    fallbackDescription:
      "Portal exclusivo para lojistas e revendedores Home Queen — preços de atacado, cadastro CNPJ e suporte comercial.",
    fallbackPath: "/atacado",
    fallbackImage: cms.wholesale.bannerImage,
  });
}

export default function AtacadoPage() {
  return (
    <main className="bg-[#F5F5F3]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <WholesalePageView />
      <SiteFooter />
    </main>
  );
}
