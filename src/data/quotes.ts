export const QUOTE_STATUSES = [
  "Novo",
  "Em análise",
  "Proposta enviada",
  "Aprovado",
  "Cancelado",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export type QuoteProductSnapshot = {
  productId: string;
  name: string;
  category: string;
  categoryId: string;
  model: string;
  type: string;
  size: string;
  color: string;
  mattress: string;
  quantity: number;
  price: number | null;
  code: string;
  sku: string;
  image: string;
  rating?: number;
  reviews?: number;
};

export type QuoteCustomer = {
  name: string;
  company: string;
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
};

export type QuoteAttachment = {
  name: string;
  size: number;
  type: string;
  storedAs: string;
};

export type QuoteRecord = {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  responsible: string;
  customer: QuoteCustomer;
  product: QuoteProductSnapshot;
  message: string;
  attachments: QuoteAttachment[];
  emailToCompany: boolean;
  emailToCustomer: boolean;
};

export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const emptyCustomer = (): QuoteCustomer => ({
  name: "",
  company: "",
  cpf: "",
  cnpj: "",
  email: "",
  phone: "",
  whatsapp: "",
  city: "",
  state: "",
});
