import { IconWhatsApp } from "@/components/icons";

const WHATSAPP_URL = "https://wa.me/5549999999999";

export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-0 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(37,211,102,0.45)] transition hover:scale-105 hover:bg-[#1ebe57] sm:bottom-6 sm:right-0 sm:h-16 sm:w-16"
    >
      <IconWhatsApp className="h-7 w-7 sm:h-8 sm:w-8" />
    </a>
  );
}
