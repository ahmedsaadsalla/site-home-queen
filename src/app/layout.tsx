import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { JsonLd } from "@/components/SeoChrome";
import { ShopDrawers } from "@/components/shop/ShopDrawers";
import { CustomerProvider } from "@/context/CustomerContext";
import { DealerProvider } from "@/context/DealerContext";
import { ShopProvider } from "@/context/ShopContext";
import { readAdminCms } from "@/lib/adminStore";
import {
  getSiteUrl,
  organizationJsonLd,
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const cms = await readAdminCms();
  const home = cms.seo?.home;
  const title = home?.title || SITE_DEFAULT_TITLE;
  const description = home?.description || SITE_DEFAULT_DESCRIPTION;
  const siteUrl = getSiteUrl();
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    applicationName: "Home Queen",
    authors: [{ name: "Home Queen" }],
    keywords: home?.keywords
      ? home.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : ["cama box", "Home Queen", "colchão", "baú"],
    icons: {
      icon: [
        { url: "/logo-home-queen.png", type: "image/png" },
        { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
        { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Home Queen",
      title,
      description,
      url: siteUrl,
      images: [
        {
          url: home?.ogImage || cms.home?.heroImage || "/hero-home-queen.jpg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: cms.integrations?.searchConsole?.verificationMeta
      ? { google: cms.integrations.searchConsole.verificationMeta }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cms = await readAdminCms();
  const phone = cms.integrations?.whatsapp?.number;
  const logo = cms.home?.logo || "/hero-home-queen.jpg";
  const hdrs = await headers();
  const maintenance = hdrs.get("x-hq-maintenance") === "1";

  if (maintenance) {
    return (
      <html lang="pt-BR">
        <body className={`${inter.variable} ${playfair.variable} antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <JsonLd
          data={[
            organizationJsonLd({ logo, phone }),
            websiteJsonLd(),
          ]}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <AnalyticsScripts />
        <DealerProvider>
          <CustomerProvider>
            <ShopProvider>
              {children}
              <ShopDrawers />
              <FloatingWhatsApp />
            </ShopProvider>
          </CustomerProvider>
        </DealerProvider>
      </body>
    </html>
  );
}
