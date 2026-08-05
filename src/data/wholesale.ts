export type DealerStatus = "Pendente" | "Aprovado" | "Recusado";

export type DealerRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: DealerStatus;
  cnpj: string;
  passwordHash: string;
  companyName: string;
  tradeName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  state: string;
  city: string;
  /** Inscrição estadual */
  stateRegistration?: string;
  blocked?: boolean;
  priceTable?: string;
  globalMinOrder?: number;
  discountPercent?: number;
  creditLimit?: number;
  carrier?: string;
  region?: string;
  paymentMethod?: string;
};

export type WholesaleQuote = {
  id: string;
  createdAt: string;
  dealerId?: string;
  name: string;
  company: string;
  cnpj: string;
  email: string;
  whatsapp: string;
  product: string;
  category?: string;
  model?: string;
  type?: string;
  size?: string;
  color?: string;
  mattress?: string;
  quantity: number;
  notes: string;
  attachments?: string[];
};
