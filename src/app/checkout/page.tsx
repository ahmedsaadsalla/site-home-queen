import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { CheckoutPageView } from "@/components/shop/CheckoutPageView";

export const metadata: Metadata = {
  title: "Checkout | Home Queen",
  description: "Finalize sua compra Home Queen com segurança.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="bg-[#F8F8F6]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <CheckoutPageView />
      <SiteFooter />
    </main>
  );
}
