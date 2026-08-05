import type { Metadata } from "next";
import { AboutPageView } from "@/components/AboutPageView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { readAdminCms } from "@/lib/adminStore";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await readAdminCms();
  return buildPageMetadata({
    page: cms.seo.factory,
    fallbackTitle: "Sobre a Home Queen",
    fallbackDescription:
      "Home Queen — fábrica de camas box e camas baú com qualidade premium para todo o Brasil.",
    fallbackPath: "/sobre",
    fallbackImage: cms.factory.banner || cms.factory.historyImage,
  });
}

export default function SobrePage() {
  return (
    <main className="bg-[#F5F5F3]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <AboutPageView />
      <SiteFooter />
    </main>
  );
}
