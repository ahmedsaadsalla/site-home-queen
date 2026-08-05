import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { CartPageView } from "@/components/shop/CartPageView";

export const metadata: Metadata = {
  title: "Carrinho | Home Queen",
  description: "Revise seus produtos e finalize sua compra Home Queen.",
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
  return (
    <main className="bg-[#F8F8F6]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <CartPageView />
      <SiteFooter />
    </main>
  );
}
