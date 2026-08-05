import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

const benefits: Array<{ icon: ReactNode; label: string }> = [
  {
    label: "Fabricação Própria",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M3 21h18M5 21V10l4-2v2l4-2v2l4-2v13M9 21v-4h4v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 8V5M15 8V4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Entrega para Todo Brasil",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7v-7z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="18" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: "Garantia de Fábrica",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Atendimento Especializado",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M4 12a8 8 0 0116 0v2a3 3 0 01-3 3h-1v-5h4M4 14h4v5H7a3 3 0 01-3-3v-2z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 19v2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M8 3h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5zm8.2 2.2a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2zM12 8.2A3.8 3.8 0 1012 15.8 3.8 3.8 0 0012 8.2z",
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    path: "M14 8h2.5V5.5H14c-2 0-3.5 1.4-3.5 3.5V11H8v2.5h2.5V21H14v-7.5h2.3L17 11h-3V9c0-.6.4-1 1-1z",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/5549999999999",
    path: "M12.04 2C6.58 2 2.14 6.38 2.14 11.78c0 1.95.55 3.8 1.6 5.43L2 22l4.96-1.64a10.05 10.05 0 004.98 1.28h.01c5.46 0 9.9-4.38 9.9-9.78S17.5 2 12.04 2zm5.77 13.86c-.24.68-1.4 1.24-1.94 1.32-.5.07-1.13.1-1.82-.11-.42-.13-.95-.3-1.64-.59-2.88-1.24-4.76-4.14-4.91-4.33-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.1.2-.14.32-.28.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.16.28.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.28.14.47.21.54.33.07.12.07.68-.17 1.36z",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    path: "M6.5 9.5H3.8V20h2.7V9.5zM5.1 4A1.6 1.6 0 105.1 7.2 1.6 1.6 0 005.1 4zM20.2 20h-2.7v-5.5c0-1.5-.6-2.4-1.9-2.4-1 0-1.5.7-1.8 1.3-.1.2-.1.6-.1.9V20h-2.7s0-8.7 0-9.5h2.7v1.5c.5-.8 1.5-1.9 3.5-1.9 2.5 0 4 1.5 4 4.8V20z",
  },
];

export function SiteFooter() {
  return (
    <footer
      id="contato"
      className="relative overflow-hidden text-[#F8F8F6]"
      style={{
        backgroundColor: "#0F0F10",
        borderTop: "1px solid rgba(200,169,106,.20)",
      }}
    >
      {/* Faixa de benefícios */}
      <div
        className="relative border-b border-[#C8A96A]/15"
        style={{ backgroundColor: "#0F0F10" }}
      >
        <div className="mx-auto flex h-20 max-w-[1240px] items-center px-6 lg:px-8">
          <ul className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2">
            {benefits.map((item) => (
              <li
                key={item.label}
                className="flex min-w-[140px] flex-1 items-center justify-center gap-3 text-center sm:justify-start sm:text-left"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C8A96A]/40 text-[#C8A96A]"
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#F8F8F6]/85">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="relative mx-auto max-w-[1240px] px-6 pb-6 pt-6 lg:px-8 lg:pb-8 lg:pt-7"
        style={{ backgroundColor: "#0F0F10" }}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:items-start">
          <div className="relative">
            <div
              className="relative inline-block"
              style={{ backgroundColor: "#0F0F10" }}
            >
              <Logo className="relative max-h-[140px] w-[168px] mix-blend-lighten sm:max-h-[160px] sm:w-[190px]" />
            </div>
            <p className="relative mt-3 max-w-xs text-[13px] leading-6 text-[#F8F8F6]/70">
              Conforto, design e excelência para transformar o descanso em
              experiência.
            </p>

            <div className="relative mt-4 flex flex-wrap gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-[#C8A96A]/45 text-[#C8A96A] transition duration-300 hover:border-[#C8A96A] hover:bg-[#C8A96A] hover:text-black"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[18px] w-[18px] fill-current transition duration-300"
                    aria-hidden
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#C8A96A] sm:text-[13px]">
              Empresa
            </p>
            <div className="mt-4 flex flex-col gap-2 text-[14px] text-white/65">
              <a href="/sobre" className="transition hover:text-[#C8A96A]">
                Sobre
              </a>
              <a
                href="/sobre#onde-estamos"
                className="transition hover:text-[#C8A96A]"
              >
                Fábrica
              </a>
              <a href="/#nosso-catalogo" className="transition hover:text-[#C8A96A]">
                Catálogo
              </a>
            </div>
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#C8A96A] sm:text-[13px]">
              Atacado
            </p>
            <div className="mt-4 flex flex-col gap-2 text-[14px] text-white/65">
              <a href="/atacado" className="transition hover:text-[#C8A96A]">
                Área do revendedor
              </a>
              <a
                href="/atacado#acesso"
                className="transition hover:text-[#C8A96A]"
              >
                Cadastro PJ
              </a>
              <a href="/orcamento" className="transition hover:text-[#C8A96A]">
                Orçamentos
              </a>
            </div>
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#C8A96A] sm:text-[13px]">
              Contato
            </p>
            <div className="mt-4 space-y-2 text-[14px] text-white/65">
              <a href="/contato" className="block transition hover:text-[#C8A96A]">
                Página de contato
              </a>
              <a
                href="https://wa.me/5549999999999"
                className="block transition hover:text-[#C8A96A]"
              >
                (49) 99999-9999
              </a>
              <p>contato@homequeen.com.br</p>
              <p>Segunda a sábado</p>
            </div>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-8 text-[13px] text-[#F8F8F6]/70 sm:gap-12 sm:text-[14px]">
          <a
            href="/carrinho"
            className="flex flex-col items-center gap-2 transition hover:text-[#C8A96A]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 fill-current text-[#C8A96A] sm:h-9 sm:w-9"
              aria-hidden
            >
              <path d="M8 7V6a4 4 0 118 0v1h2.2c.7 0 1.2.6 1.1 1.3l-1.2 10A1.5 1.5 0 0116.6 20H7.4a1.5 1.5 0 01-1.5-1.7l-1.2-10A1.1 1.1 0 015.8 7H8zm2 0h4V6a2 2 0 10-4 0v1z" />
            </svg>
            Carrinho
          </a>
          <a
            href="/favoritos"
            className="flex flex-col items-center gap-2 transition hover:text-[#C8A96A]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 fill-current text-[#C8A96A] sm:h-9 sm:w-9"
              aria-hidden
            >
              <path d="M12.1 21.35l-1.1-1C6.1 15.4 2.5 12.2 2.5 8.5A4.5 4.5 0 017 4a4.9 4.9 0 015.1 2.3A4.9 4.9 0 0117.2 4a4.5 4.5 0 014.5 4.5c0 3.7-3.6 6.9-8.5 11.85l-1.1 1z" />
            </svg>
            Favoritos
          </a>
          <a
            href="/minha-conta"
            className="flex flex-col items-center gap-2 transition hover:text-[#C8A96A]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 fill-current text-[#C8A96A] sm:h-9 sm:w-9"
              aria-hidden
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Minha conta
          </a>
        </div>

        {/* Formas de pagamento — centro, ícones grandes */}
        <div className="mt-3 flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
            {paymentMethods.map((pay) => (
              <div
                key={pay.id}
                title={pay.label}
                className="flex h-12 w-[78px] items-center justify-center overflow-hidden rounded-[10px] border border-white/15 bg-[#F8F8F6] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.25)] sm:h-14 sm:w-[88px]"
              >
                {pay.icon}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.18em] text-[#C8A96A] sm:text-[14px]">
            Formas de pagamento
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] text-white/40">
          © {new Date().getFullYear()} Home Queen Camas Box. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}

const paymentMethods = [
  {
    id: "pix",
    label: "PIX",
    icon: (
      <Image
        src="/pagamentos/pix.png"
        alt="PIX"
        width={120}
        height={120}
        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
      />
    ),
  },
  {
    id: "visa",
    label: "Visa",
    icon: (
      <svg viewBox="0 0 64 24" className="h-7 w-14 sm:h-8 sm:w-16" aria-hidden>
        <text
          x="2"
          y="18"
          fill="#1A1F71"
          fontFamily="Arial, sans-serif"
          fontWeight="800"
          fontSize="18"
          letterSpacing="1"
        >
          VISA
        </text>
      </svg>
    ),
  },
  {
    id: "mastercard",
    label: "Mastercard",
    icon: (
      <svg viewBox="0 0 48 30" className="h-8 w-12 sm:h-9 sm:w-14" aria-hidden>
        <circle cx="18" cy="15" r="10" fill="#EB001B" />
        <circle cx="30" cy="15" r="10" fill="#F79E1B" />
        <path
          d="M24 7.6a10 10 0 010 14.8 10 10 0 000-14.8z"
          fill="#FF5F00"
        />
      </svg>
    ),
  },
  {
    id: "elo",
    label: "Elo",
    icon: (
      <Image
        src="/pagamentos/elo.png"
        alt="Elo"
        width={140}
        height={140}
        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
      />
    ),
  },
  {
    id: "boleto",
    label: "Boleto",
    icon: (
      <svg viewBox="0 0 48 32" className="h-8 w-12 sm:h-9 sm:w-14" aria-hidden>
        <rect x="2" y="4" width="2.2" height="24" fill="#0F0F10" />
        <rect x="6" y="4" width="1.2" height="24" fill="#0F0F10" />
        <rect x="9" y="4" width="3" height="24" fill="#0F0F10" />
        <rect x="14" y="4" width="1.2" height="24" fill="#0F0F10" />
        <rect x="17" y="4" width="2.2" height="24" fill="#0F0F10" />
        <rect x="21" y="4" width="1.2" height="24" fill="#0F0F10" />
        <rect x="24" y="4" width="3.2" height="24" fill="#0F0F10" />
        <rect x="29" y="4" width="1.2" height="24" fill="#0F0F10" />
        <rect x="32" y="4" width="2" height="24" fill="#0F0F10" />
        <rect x="36" y="4" width="1.2" height="24" fill="#0F0F10" />
        <rect x="39" y="4" width="3" height="24" fill="#0F0F10" />
        <rect x="44" y="4" width="2" height="24" fill="#0F0F10" />
      </svg>
    ),
  },
];
