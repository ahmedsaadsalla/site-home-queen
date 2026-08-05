export type CustomerAddress = {
  id: string;
  label: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  isDefault?: boolean;
};

export type OrderTrackingStatus =
  | "Recebido"
  | "Em produção"
  | "Enviado"
  | "Em trânsito"
  | "Entregue"
  | "Cancelado";

export type CustomerOrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
};

export type CustomerOrder = {
  id: string;
  createdAt: string;
  status: OrderTrackingStatus;
  trackingCode?: string;
  carrier?: string;
  eta?: string;
  total: number;
  items: CustomerOrderItem[];
  invoiceUrl?: string;
  blingOrderId?: string;
};

export type WarrantyClaim = {
  id: string;
  createdAt: string;
  orderId: string;
  productName: string;
  status: "Aberto" | "Em análise" | "Resolvido";
  notes: string;
};

export type CustomerRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  whatsapp: string;
  passwordHash: string;
  addresses: CustomerAddress[];
  favoriteProductIds: string[];
  orders: CustomerOrder[];
  warranties: WarrantyClaim[];
  /** ID do contato no Bling após 1ª compra */
  blingContactId?: string;
  blingSyncedAt?: string;
};

export type CustomerPublic = Omit<CustomerRecord, "passwordHash">;
