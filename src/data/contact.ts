export type HelpIntent =
  | "cliente"
  | "orcamento"
  | "pos-venda";

export type ContactMessage = {
  id: string;
  createdAt: string;
  helpIntent: HelpIntent;
  name: string;
  company: string;
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  subject: string;
  message: string;
};

export type ContactSettings = {
  addressLine1: string;
  addressLine2: string;
  cep: string;
  mapsQuery: string;
  mapsEmbedUrl: string;
  phoneCommercial: string;
  phoneSales: string;
  phoneWholesale: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  emailSales: string;
  emailSupport: string;
  emailFinance: string;
  hoursWeekdays: string;
  hoursSaturday: string;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  addressLine1: "Rodovia SC-480, nº 1234",
  addressLine2: "Chapecó - SC",
  cep: "89801-970",
  mapsQuery: "Chapecó SC",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=Chapec%C3%B3%20SC&t=&z=13&ie=UTF8&iwloc=&output=embed",
  phoneCommercial: "(49) 99999-9991",
  phoneSales: "(49) 99999-9992",
  phoneWholesale: "(49) 99999-9993",
  whatsappNumber: "5549999999999",
  whatsappDisplay: "(49) 99999-9999",
  emailSales: "vendas@homequeen.com.br",
  emailSupport: "atendimento@homequeen.com.br",
  emailFinance: "financeiro@homequeen.com.br",
  hoursWeekdays: "Segunda a Sexta — 08h às 18h",
  hoursSaturday: "Sábado — 08h às 12h",
};

export const HELP_OPTIONS: {
  id: HelpIntent;
  label: string;
  subject: string;
  hint: string;
}[] = [
  {
    id: "cliente",
    label: "Sou Cliente",
    subject: "Atendimento ao cliente",
    hint: "Dúvidas sobre produtos, pedidos e entregas.",
  },
  {
    id: "orcamento",
    label: "Solicitar Orçamento",
    subject: "Solicitação de orçamento",
    hint: "Proposta personalizada para varejo ou atacado.",
  },
  {
    id: "pos-venda",
    label: "Suporte Pós-Venda",
    subject: "Suporte pós-venda",
    hint: "Garantia, troca e acompanhamento do pedido.",
  },
];

export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

export const CONTACT_SUBJECTS = [
  "Atendimento ao cliente",
  "Solicitação de orçamento",
  "Suporte pós-venda",
  "Dúvida sobre produto",
  "Pedido e entrega",
  "Outro assunto",
] as const;
