import type { Metadata } from "next";
import { Suspense } from "react";
import { BenefitsBar } from "@/components/BenefitsBar";
import { CategoriesSection } from "@/components/CategoriesSection";
import { FactorySection } from "@/components/FactorySection";
import { FeaturedProductsSection } from "@/components/FeaturedProductsSection";
import { Hero } from "@/components/Hero";
import { HomeCatalogShowcase } from "@/components/HomeCatalogShowcase";
import { HomeWholesaleBand } from "@/components/HomeWholesaleBand";
import { MapSection } from "@/components/MapSection";
import { PartnersSection } from "@/components/PartnersSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsSection } from "@/components/StatsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { TopBar } from "@/components/TopBar";
import { WhyChooseSection } from "@/components/WhyChooseSection";
import { readAdminCms } from "@/lib/adminStore";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await readAdminCms();
  return buildPageMetadata({
    page: cms.seo.home,
    fallbackTitle: "Home Queen | Camas Box Premium e Baús",
    fallbackDescription:
      "Conheça as camas box premium, baús, colchões e acessórios Home Queen. Qualidade, conforto e entrega para todo o Brasil.",
    fallbackPath: "/",
    fallbackImage: cms.home.heroImage || "/hero-home-queen.jpg",
  });
}

export default function Home() {
  return (
    <main className="bg-[#F5F5F3] text-[#0F0F10]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
        <Hero />
      </div>

      <BenefitsBar />
      <StatsSection />
      <Suspense fallback={<div className="min-h-[320px] bg-[#F8F8F6]" />}>
        <HomeCatalogShowcase />
      </Suspense>
      <CategoriesSection />
      <FeaturedProductsSection />
      <FactorySection />
      <WhyChooseSection />
      <HomeWholesaleBand />
      <TestimonialsSection />
      <PartnersSection />
      <MapSection />
      <SiteFooter />
    </main>
  );
}
