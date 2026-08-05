"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BRAZIL_STATES,
  CONTACT_SUBJECTS,
  DEFAULT_CONTACT_SETTINGS,
  HELP_OPTIONS,
  type ContactSettings,
  type HelpIntent,
} from "@/data/contact";

const inputClass =
  "w-full rounded-md border border-[#E5E5E5] bg-white px-4 py-3 text-[14px] text-[#0F0F10] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#C5A059]";

const faqs = [
  {
    q: "Entregam para todo o Brasil?",
    a: "Sim. Enviamos para todo o território nacional com logística estruturada e acompanhamento do pedido até a entrega.",
  },
  {
    q: "Fabricam sob medida?",
    a: "Sim. Avaliamos medidas, modelo e acabamento sob demanda. Envie os detalhes pelo formulário ou WhatsApp para análise técnica.",
  },
  {
    q: "Como funciona a garantia?",
    a: "Os produtos Home Queen possuem garantia contra defeitos de fabricação. As condições estão na página do produto e na documentação da compra.",
  },
  {
    q: "Como solicitar orçamento?",
    a: "Escolha “Solicitar Orçamento” no topo da página, preencha os dados desejados e envie a mensagem. Nossa equipe comercial retorna com a proposta.",
  },
  {
    q: "Quais formas de pagamento aceitam?",
    a: "Aceitamos PIX, cartões e boleto. Condições especiais para revendedores podem ser combinadas no atendimento comercial.",
  },
  {
    q: "Vocês atendem atacado?",
    a: "Sim. Temos área B2B com cadastro por CNPJ, tabelas exclusivas e acompanhamento para lojistas e revendedores.",
  },
];

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function telHref(display: string) {
  const d = digitsOnly(display);
  return d ? `tel:+55${d}` : "#";
}

export function ContactPageView() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [heroTitle, setHeroTitle] = useState("Fale com a Home Queen");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Atendimento comercial e suporte para varejo e atacado.",
  );
  const [formTitle, setFormTitle] = useState("Envie sua mensagem");
  const [formSubtitle, setFormSubtitle] = useState(
    "Retornamos o mais rápido possível.",
  );
  const [banner, setBanner] = useState("");
  const [faqList, setFaqList] = useState(faqs);
  const [helpIntent, setHelpIntent] = useState<HelpIntent>("cliente");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SC");
  const [subject, setSubject] = useState(HELP_OPTIONS[0].subject);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    void Promise.all([
      fetch("/api/contato/settings").then((r) => r.json()),
      fetch("/api/cms").then((r) => r.json()),
    ])
      .then(([data, cms]) => {
        setSettings({ ...DEFAULT_CONTACT_SETTINGS, ...(data as ContactSettings) });
        if (cms?.contactPage?.heroTitle) setHeroTitle(cms.contactPage.heroTitle);
        if (cms?.contactPage?.heroSubtitle)
          setHeroSubtitle(cms.contactPage.heroSubtitle);
        if (cms?.contactPage?.formTitle) setFormTitle(cms.contactPage.formTitle);
        if (cms?.contactPage?.formSubtitle)
          setFormSubtitle(cms.contactPage.formSubtitle);
        if (cms?.contactPage?.faq?.length) setFaqList(cms.contactPage.faq);
        if (cms?.pageMedia?.contact?.banner)
          setBanner(cms.pageMedia.contact.banner);
      })
      .catch(() => undefined);
  }, []);

  const helpMeta = useMemo(
    () => HELP_OPTIONS.find((o) => o.id === helpIntent) || HELP_OPTIONS[0],
    [helpIntent],
  );

  useEffect(() => {
    setSubject(helpMeta.subject);
  }, [helpMeta.subject]);

  const showCompanyStrong = helpIntent === "orcamento";
  const documentLabel =
    helpIntent === "orcamento" ? "CNPJ" : "CPF ou CNPJ";

  const waUrl = `https://wa.me/${settings.whatsappNumber}`;
  const mapsDirections = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapsQuery)}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helpIntent,
          name,
          company,
          document,
          email,
          phone,
          whatsapp,
          city,
          state,
          subject,
          message,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar.");
        return;
      }
      setSent(true);
      setName("");
      setCompany("");
      setDocument("");
      setEmail("");
      setPhone("");
      setWhatsapp("");
      setCity("");
      setState("SC");
      setMessage("");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-[#F5F5F3] text-[#0F0F10]">
      {/* Hero 600px */}
      <section className="relative h-[300px] overflow-hidden bg-black text-white">
        <Image
          src={banner || "/fabrica/cama-01.jpg"}
          alt="Fachada e fábrica Home Queen"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1240px] items-center px-6 lg:px-8">
          <div className="max-w-[560px]">
            <h1 className="font-display text-[28px] leading-[1.12] sm:text-[34px] lg:text-[38px]">
              {heroTitle}
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-white/78 sm:text-[15px]">
              {heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/orcamento"
                className="inline-flex items-center rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                Solicitar orçamento
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-white/35 bg-black/50 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Seletor + Formulário 65/35 */}
      <section id="fale-conosco" className="scroll-mt-8 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <h2 className="font-display text-[30px] sm:text-[34px]">
            Como podemos ajudar?
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#2E2E2E]/80">
            Escolha o tipo de atendimento. O formulário se adapta automaticamente
            para agilizar a triagem da nossa equipe.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {HELP_OPTIONS.map((option) => {
              const active = helpIntent === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setHelpIntent(option.id)}
                  className={`rounded-[14px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-[#C5A059] bg-[#0F0F10] text-white shadow-[0_10px_28px_rgba(15,15,16,0.18)]"
                      : "border-[#EAEAEA] bg-[#FBFBF9] text-[#0F0F10] hover:border-[#C5A059]/50"
                  }`}
                >
                  <span
                    className={`mb-2 inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                      active ? "border-[#C5A059]" : "border-[#C5A059]/60"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        active ? "bg-[#C5A059]" : "bg-transparent"
                      }`}
                    />
                  </span>
                  <p className="text-[14px] font-bold">{option.label}</p>
                  <p
                    className={`mt-1 text-[12px] leading-5 ${
                      active ? "text-white/65" : "text-[#6B6B6B]"
                    }`}
                  >
                    {option.hint}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[13fr_7fr] lg:gap-8">
            {/* Form 65% */}
            <div className="rounded-[18px] border border-[#EAEAEA] bg-[#FBFBF9] p-6 shadow-[0_10px_30px_rgba(15,15,16,0.04)] sm:p-8">
              <h3 className="font-display text-[26px]">{formTitle}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#6B6B6B]">
                {formSubtitle} {helpMeta.hint}
              </p>

              {sent ? (
                <div className="py-12 text-center">
                  <p className="font-display text-[28px]">Mensagem enviada</p>
                  <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-[#2E2E2E]/80">
                    Recebemos sua solicitação. A equipe Home Queen entrará em
                    contato em breve.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-8 inline-flex rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
                  >
                    Nova mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nome">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        placeholder="Seu nome"
                      />
                    </Field>
                    <Field
                      label={
                        showCompanyStrong ? "Empresa *" : "Empresa"
                      }
                    >
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className={inputClass}
                        placeholder="Razão social ou nome fantasia"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={documentLabel}>
                      <input
                        value={document}
                        onChange={(e) => setDocument(e.target.value)}
                        className={inputClass}
                        placeholder={
                          helpIntent === "orcamento"
                            ? "00.000.000/0000-00"
                            : "CPF ou CNPJ"
                        }
                      />
                    </Field>
                    <Field label="E-mail">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        placeholder="voce@email.com"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Telefone">
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                        placeholder="(99) 999999-9999"
                      />
                    </Field>
                    <Field label="WhatsApp">
                      <input
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className={inputClass}
                        placeholder="(99) 999999-9999"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Cidade">
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={inputClass}
                        placeholder="Chapecó"
                      />
                    </Field>
                    <Field label="Estado">
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={inputClass}
                      >
                        {BRAZIL_STATES.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Assunto">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={inputClass}
                    >
                      {CONTACT_SUBJECTS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Mensagem *">
                    <textarea
                      required
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`${inputClass} resize-y`}
                      placeholder="Descreva sua solicitação..."
                    />
                  </Field>

                  {error ? (
                    <p className="text-[13px] text-red-600">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex rounded-md bg-[#C5A059] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-[#d4b06a] disabled:opacity-60"
                  >
                    {sending ? "Enviando..." : "Enviar mensagem"}
                  </button>
                </form>
              )}
            </div>

            {/* Info cards 35% */}
            <aside className="space-y-4">
              <InfoCard title="Endereço">
                <p>{settings.addressLine1}</p>
                <p>{settings.addressLine2}</p>
                <p>CEP {settings.cep}</p>
              </InfoCard>

              <InfoCard title="Telefones">
                <p>
                  Comercial:{" "}
                  <a className="hover:text-[#C5A059]" href={telHref(settings.phoneCommercial)}>
                    {settings.phoneCommercial}
                  </a>
                </p>
                <p>
                  Vendas:{" "}
                  <a className="hover:text-[#C5A059]" href={telHref(settings.phoneSales)}>
                    {settings.phoneSales}
                  </a>
                </p>
                <p>
                  Atacado:{" "}
                  <a className="hover:text-[#C5A059]" href={telHref(settings.phoneWholesale)}>
                    {settings.phoneWholesale}
                  </a>
                </p>
              </InfoCard>

              <InfoCard title="WhatsApp">
                <p>{settings.whatsappDisplay}</p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex rounded-md bg-[#C5A059] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
                >
                  Conversar agora
                </a>
              </InfoCard>

              <InfoCard title="E-mail">
                <p>
                  Vendas:{" "}
                  <a className="hover:text-[#C5A059]" href={`mailto:${settings.emailSales}`}>
                    {settings.emailSales}
                  </a>
                </p>
                <p>
                  Atendimento:{" "}
                  <a className="hover:text-[#C5A059]" href={`mailto:${settings.emailSupport}`}>
                    {settings.emailSupport}
                  </a>
                </p>
                <p>
                  Financeiro:{" "}
                  <a className="hover:text-[#C5A059]" href={`mailto:${settings.emailFinance}`}>
                    {settings.emailFinance}
                  </a>
                </p>
              </InfoCard>

              <InfoCard title="Horário">
                <p>{settings.hoursWeekdays}</p>
                <p>{settings.hoursSaturday}</p>
              </InfoCard>
            </aside>
          </div>
        </div>
      </section>

      {/* Mapa full width */}
      <section id="mapa" className="scroll-mt-8 bg-white py-14 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[30px] sm:text-[34px]">Mapa</h2>
              <p className="mt-2 text-[15px] leading-7 text-[#2E2E2E]/80">
                {settings.addressLine1} — {settings.addressLine2}
              </p>
            </div>
            <a
              href={mapsDirections}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
            >
              Como chegar
            </a>
          </div>
          <div className="mt-6 overflow-hidden rounded-[16px] border border-[#EAEAEA] shadow-[0_10px_30px_rgba(15,15,16,0.06)]">
            <iframe
              title="Mapa Home Queen"
              className="h-[360px] w-full sm:h-[420px]"
              src={settings.mapsEmbedUrl}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F5F5F3] py-16 lg:py-20">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <h2 className="font-display text-[30px] sm:text-[34px]">
            Perguntas frequentes
          </h2>
          <div className="mt-10 space-y-3">
            {faqList.map((item, index) => {
              const open = openFaq === index;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-[14px] border border-[#EAEAEA] bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                    aria-expanded={open}
                  >
                    <span className="text-[15px] font-semibold">{item.q}</span>
                    <span
                      className={`text-[20px] font-light text-[#C5A059] transition ${
                        open ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-[#EAEAEA] px-5 pb-5 pt-3 text-[14px] leading-7 text-[#2E2E2E]/85 sm:px-6">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA rodapé da página */}
      <section className="bg-black py-16 text-white lg:py-20">
        <div className="mx-auto max-w-[1240px] px-6 text-center lg:px-8">
          <h2 className="font-display text-[32px] sm:text-[38px]">
            Vamos transformar seu descanso?
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/#nosso-catalogo"
              className="inline-flex rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
            >
              Ver produtos
            </Link>
            <Link
              href="/orcamento"
              className="inline-flex rounded-md border border-white/35 bg-transparent px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
            >
              Solicitar orçamento
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-[#C5A059]/25 bg-[#0F0F10] p-5 text-white shadow-[0_12px_28px_rgba(15,15,16,0.16)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C5A059]">
        {title}
      </p>
      <div className="mt-3 space-y-1 text-[13px] leading-6 text-white/80">
        {children}
      </div>
    </div>
  );
}
