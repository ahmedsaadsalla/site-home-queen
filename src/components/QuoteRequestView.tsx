"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BRAZIL_STATES,
  emptyCustomer,
  type QuoteCustomer,
  type QuoteProductSnapshot,
} from "@/data/quotes";
import { formatBRL } from "@/data/productDetail";
import { getVisibleCategories } from "@/data/homeCatalog";

type Props = {
  product: QuoteProductSnapshot;
  breadcrumb: Array<{ label: string; href?: string }>;
};

const fieldClass =
  "mt-1.5 w-full rounded-[10px] border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-[13px] text-[#0F0F10] outline-none transition placeholder:text-[#A3A3A3] focus:border-[#C8A96A]";

const labelClass = "text-[12px] font-medium text-[#2E2E2E]";

function emptyOrder(base: QuoteProductSnapshot): QuoteProductSnapshot {
  return {
    ...base,
    name: "",
    category: "",
    model: "",
    type: "",
    size: "",
    color: "",
    mattress: "",
    quantity: 1,
  };
}

export function QuoteRequestView({ product: initialProduct, breadcrumb }: Props) {
  const [customer, setCustomer] = useState<QuoteCustomer>(emptyCustomer);
  const [order, setOrder] = useState(() => emptyOrder(initialProduct));
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [pageCopy, setPageCopy] = useState({
    title: "Solicite seu orçamento",
    subtitle:
      "Informe os dados que desejar e nossa equipe comercial entrará em contato com a melhor proposta.",
    successTitle: "Solicitação enviada com sucesso!",
    successText:
      "Recebemos seu pedido de orçamento. Nossa equipe comercial analisará as informações e entrará em contato pelos dados informados.",
    trustTitle: "Por que pedir orçamento conosco",
    trustItems: [] as string[],
    banner: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => getVisibleCategories(), []);

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (!cms?.quotePage) return;
        setPageCopy((prev) => ({
          title: cms.quotePage.title || prev.title,
          subtitle: cms.quotePage.subtitle || prev.subtitle,
          successTitle: cms.quotePage.successTitle || prev.successTitle,
          successText: cms.quotePage.successText || prev.successText,
          trustTitle: cms.quotePage.trustTitle || prev.trustTitle,
          trustItems: cms.quotePage.trustItems || [],
          banner: cms.quotePage.banner || "",
        }));
      })
      .catch(() => undefined);
  }, []);

  const stars = useMemo(
    () =>
      Array.from(
        { length: 5 },
        (_, i) => i < Math.round(initialProduct.rating ?? 5),
      ),
    [initialProduct.rating],
  );

  function updateCustomer<K extends keyof QuoteCustomer>(
    key: K,
    value: QuoteCustomer[K],
  ) {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  }

  function updateOrder<K extends keyof QuoteProductSnapshot>(
    key: K,
    value: QuoteProductSnapshot[K],
  ) {
    setOrder((prev) => ({ ...prev, [key]: value }));
  }

  function clearForm() {
    setCustomer(emptyCustomer());
    setMessage("");
    setFiles([]);
    setOrder(emptyOrder(initialProduct));
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onFilesSelected(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.size <= 10 * 1024 * 1024);
    setFiles((prev) => [...prev, ...next].slice(0, 5));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const product: QuoteProductSnapshot = {
        ...initialProduct,
        name: order.name.trim() || initialProduct.name,
        category: order.category.trim() || initialProduct.category,
        model: order.model.trim() || initialProduct.model,
        type: order.type.trim() || initialProduct.type,
        size: order.size.trim() || initialProduct.size,
        color: order.color.trim() || initialProduct.color,
        mattress: order.mattress.trim() || initialProduct.mattress,
        quantity: Math.max(1, order.quantity || 1),
      };

      const form = new FormData();
      form.set(
        "payload",
        JSON.stringify({
          customer,
          product,
          message,
        }),
      );
      files.forEach((file) => form.append("files", file));

      const res = await fetch("/api/orcamentos", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        quote?: { number: string };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.quote) {
        throw new Error(data.error || "Falha ao enviar.");
      }
      setSuccessNumber(data.quote.number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (successNumber) {
    return (
      <section className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-xl rounded-[20px] border border-[#EEEAE4] bg-white px-8 py-12 text-center shadow-[0_12px_40px_rgba(15,15,16,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#C8A96A]/20 text-[#C8A96A]">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="font-display mt-6 text-[32px] text-[#0F0F10]">
            {pageCopy.successTitle}
          </h1>
          <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#C8A96A]">
            {successNumber}
          </p>
          <p className="mt-4 text-[15px] leading-7 text-[#6B6B6B]">
            {pageCopy.successText}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/#nosso-catalogo"
              className="rounded-[10px] bg-[#C8A96A] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F]"
            >
              Continuar comprando
            </Link>
            <Link
              href="/"
              className="rounded-[10px] border border-[#0F0F10]/25 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:border-[#C8A96A] hover:text-[#C8A96A]"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10 lg:py-16">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B6B6B]">
        {breadcrumb.map((item, i) => (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 ? <span className="text-[#C8A96A]">›</span> : null}
            {item.href ? (
              <Link href={item.href} className="transition hover:text-[#C8A96A]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#0F0F10]">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <h1 className="font-display mt-6 text-[34px] leading-tight text-[#0F0F10] sm:text-[40px]">
        {pageCopy.title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6B6B6B]">
        {pageCopy.subtitle}
      </p>
      {pageCopy.banner ? (
        <div className="relative mt-6 h-40 overflow-hidden rounded-2xl sm:h-52">
          <Image
            src={pageCopy.banner}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>
      ) : null}
      {pageCopy.trustItems.length > 0 ? (
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-[#0F0F10]">
            {pageCopy.trustTitle}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {pageCopy.trustItems.map((item) => (
              <li
                key={item}
                className="rounded-full border border-[#C8A96A]/40 bg-[#FAF7F0] px-3 py-1 text-[12px] text-[#2E2E2E]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)]"
      >
        <div className="space-y-6">
          <div className="rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_8px_30px_rgba(15,15,16,0.04)] sm:p-7">
            <SectionTitle icon={<PersonIcon />} title="Seus dados (opcional)" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo">
                <input
                  className={fieldClass}
                  placeholder="Seu nome"
                  value={customer.name}
                  onChange={(e) => updateCustomer("name", e.target.value)}
                />
              </Field>
              <Field label="Empresa">
                <input
                  className={fieldClass}
                  placeholder="Nome da empresa"
                  value={customer.company}
                  onChange={(e) => updateCustomer("company", e.target.value)}
                />
              </Field>
              <Field label="CPF">
                <input
                  className={fieldClass}
                  placeholder="000.000.000-00"
                  value={customer.cpf}
                  onChange={(e) => updateCustomer("cpf", e.target.value)}
                />
              </Field>
              <Field label="CNPJ">
                <input
                  className={fieldClass}
                  placeholder="00.000.000/0000-00"
                  value={customer.cnpj}
                  onChange={(e) => updateCustomer("cnpj", e.target.value)}
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  className={fieldClass}
                  placeholder="seu@email.com"
                  value={customer.email}
                  onChange={(e) => updateCustomer("email", e.target.value)}
                />
              </Field>
              <Field label="Telefone">
                <input
                  className={fieldClass}
                  placeholder="(00) 0000-0000"
                  value={customer.phone}
                  onChange={(e) => updateCustomer("phone", e.target.value)}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  className={fieldClass}
                  placeholder="(00) 00000-0000"
                  value={customer.whatsapp}
                  onChange={(e) => updateCustomer("whatsapp", e.target.value)}
                />
              </Field>
              <Field label="Cidade">
                <input
                  className={fieldClass}
                  placeholder="Sua cidade"
                  value={customer.city}
                  onChange={(e) => updateCustomer("city", e.target.value)}
                />
              </Field>
              <Field label="Estado">
                <select
                  className={fieldClass}
                  value={customer.state}
                  onChange={(e) => updateCustomer("state", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_8px_30px_rgba(15,15,16,0.04)] sm:p-7">
            <SectionTitle icon={<BoxIcon />} title="Dados do pedido" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Produto">
                <input
                  className={fieldClass}
                  placeholder="Ex.: Cama Box Baú King"
                  value={order.name}
                  onChange={(e) => updateOrder("name", e.target.value)}
                />
              </Field>
              <Field label="Categoria">
                <select
                  className={fieldClass}
                  value={order.category}
                  onChange={(e) => {
                    const selected = categories.find(
                      (c) => c.label === e.target.value,
                    );
                    setOrder((prev) => ({
                      ...prev,
                      category: e.target.value,
                      categoryId: selected?.id || prev.categoryId,
                    }));
                  }}
                >
                  <option value="">Selecione a categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Modelo">
                <input
                  className={fieldClass}
                  placeholder="Ex.: Premium"
                  value={order.model}
                  onChange={(e) => updateOrder("model", e.target.value)}
                />
              </Field>
              <Field label="Tipo">
                <input
                  className={fieldClass}
                  placeholder="Ex.: Box + Colchão"
                  value={order.type}
                  onChange={(e) => updateOrder("type", e.target.value)}
                />
              </Field>
              <Field label="Tamanho">
                <input
                  className={fieldClass}
                  placeholder="Ex.: King Bipartido"
                  value={order.size}
                  onChange={(e) => updateOrder("size", e.target.value)}
                />
              </Field>
              <Field label="Cor">
                <input
                  className={fieldClass}
                  placeholder="Ex.: Preto"
                  value={order.color}
                  onChange={(e) => updateOrder("color", e.target.value)}
                />
              </Field>
              <Field label="Colchão (opcional)">
                <input
                  className={fieldClass}
                  placeholder="Ex.: Airtech Ortobom"
                  value={order.mattress}
                  onChange={(e) => updateOrder("mattress", e.target.value)}
                />
              </Field>
              <Field label="Quantidade">
                <div className="mt-1.5 inline-flex items-center overflow-hidden rounded-[10px] border border-[#E5E5E5]">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-[#2E2E2E] transition hover:text-[#C8A96A]"
                    onClick={() =>
                      updateOrder("quantity", Math.max(1, order.quantity - 1))
                    }
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center text-[14px] font-medium">
                    {order.quantity}
                  </span>
                  <button
                    type="button"
                    className="px-4 py-2.5 text-[#2E2E2E] transition hover:text-[#C8A96A]"
                    onClick={() => updateOrder("quantity", order.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_8px_30px_rgba(15,15,16,0.04)] sm:p-7">
            <SectionTitle
              icon={<NoteIcon />}
              title="Informações adicionais (opcional)"
            />
            <div className="mt-5">
              <Field label="Mensagem">
                <textarea
                  rows={5}
                  className={`${fieldClass} resize-y`}
                  placeholder="Descreva exatamente o que você precisa, quantidades, prazo, personalizações ou qualquer outra informação."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Field>

              <div className="mt-4">
                <p className={labelClass}>Anexar arquivos (opcional)</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    onFilesSelected(e.dataTransfer.files);
                  }}
                  className="mt-1.5 flex w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-[#D6D0C6] bg-[#FBFBF9] px-4 py-8 text-center transition hover:border-[#C8A96A]"
                >
                  <CloudIcon />
                  <span className="mt-2 text-[13px] font-medium text-[#2E2E2E]">
                    Arraste arquivos aqui ou clique para selecionar
                  </span>
                  <span className="mt-1 text-[12px] text-[#8A8A8A]">
                    PDF, DOCX, XLSX, PNG ou JPG (máx. 10MB)
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => onFilesSelected(e.target.files)}
                />
                {files.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 text-[12px] text-[#6B6B6B]">
                    {files.map((file) => (
                      <li
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-[#F5F5F3] px-3 py-2"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          className="shrink-0 text-[#C8A96A] hover:underline"
                          onClick={() =>
                            setFiles((prev) => prev.filter((f) => f !== file))
                          }
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-[13px] text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearForm}
              className="rounded-[10px] border border-[#0F0F10]/30 bg-white px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:border-[#C8A96A]"
            >
              Limpar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#C8A96A] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F] disabled:opacity-60"
            >
              <SendIcon />
              {submitting ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_8px_30px_rgba(15,15,16,0.04)] lg:sticky lg:top-6">
          <h2 className="text-[15px] font-semibold text-[#0F0F10]">
            Resumo do produto
          </h2>
          <div className="mt-2 h-px w-16 bg-[#C8A96A]" />

          <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-[12px] bg-[#F0EEEA]">
            {initialProduct.image ? (
              <Image
                src={initialProduct.image}
                alt={initialProduct.name}
                fill
                className="object-cover"
                sizes="360px"
              />
            ) : null}
          </div>

          <h3 className="mt-4 text-[16px] font-semibold leading-snug text-[#0F0F10]">
            {initialProduct.name}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6B6B6B]">
            <span className="inline-flex text-[#C8A96A]">
              {stars.map((on, i) => (
                <span key={i}>{on ? "★" : "☆"}</span>
              ))}
            </span>
            <span>
              {(initialProduct.rating ?? 4.9).toFixed(1)} (
              {initialProduct.reviews ?? 0} avaliações)
            </span>
          </div>

          {initialProduct.price != null && initialProduct.price > 0 ? (
            <p className="mt-3 text-[18px] font-bold text-[#0F0F10]">
              {formatBRL(initialProduct.price)}
            </p>
          ) : null}

          <dl className="mt-4 space-y-2.5 text-[13px]">
            <Row label="Tipo" value={initialProduct.type} />
            <Row label="Tamanho" value={initialProduct.size} />
            <Row label="Colchão" value={initialProduct.mattress} />
            <Row label="Cor" value={initialProduct.color} />
            <Row label="Quantidade" value={String(order.quantity)} />
          </dl>

          <div className="mt-4 border-t border-[#EEEAE4] pt-4 space-y-2 text-[12px] text-[#6B6B6B]">
            <p>
              <span className="font-medium text-[#2E2E2E]">Categoria:</span>{" "}
              {initialProduct.category}
            </p>
            <p>
              <span className="font-medium text-[#2E2E2E]">Código:</span>{" "}
              {initialProduct.code}
            </p>
            <p>
              <span className="font-medium text-[#2E2E2E]">SKU:</span>{" "}
              {initialProduct.sku}
            </p>
          </div>

          <div className="mt-5 flex gap-2.5 rounded-[12px] bg-[#F3EBD9] px-3.5 py-3 text-[12px] leading-5 text-[#5C4A2A]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C8A96A] text-[11px] font-bold text-white">
              i
            </span>
            O valor será informado em nossa proposta personalizada.
          </div>
        </aside>
      </form>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#C8A96A]">{icon}</span>
      <h2 className="text-[15px] font-semibold text-[#0F0F10]">{title}</h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[#8A8A8A]">{label}</dt>
      <dd className="text-right font-medium text-[#0F0F10]">{value || "—"}</dd>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19c0-3.2 3.1-5.5 7-5.5s7 2.3 7 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4 8l8-4 8 4v8l-8 4-8-4V8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 12v8M4 8l8 4 8-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M7 3h8l4 4v14H7V3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M15 3v4h4M9 12h6M9 16h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#C8A96A]" fill="none" aria-hidden>
      <path
        d="M8 17h9a4 4 0 00.3-8 5.5 5.5 0 00-10.6 1.5A3.5 3.5 0 008 17z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 11v6M12 11l-2.5 2.5M12 11l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M3.4 20.6l17.8-8.1c.8-.4.8-1.5 0-1.9L3.4 2.5c-.9-.4-1.8.5-1.4 1.4L5 10.5 14 12 5 13.5 2 19.2c-.4.9.5 1.8 1.4 1.4z" />
    </svg>
  );
}
