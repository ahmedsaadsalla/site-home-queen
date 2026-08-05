import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { FavoritesPageView } from "@/components/shop/FavoritesPageView";

export const metadata: Metadata = {
  title: "Favoritos | Home Queen",
  description: "Produtos salvos na sua lista de favoritos Home Queen.",
  robots: { index: false, follow: false },
};

export default function FavoritosPage() {
  return (
    <main className="bg-[#F8F8F6]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <FavoritesPageView />
      <SiteFooter />
    </main>
  );
}
