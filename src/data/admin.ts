export type AdminRole =
  | "Administrador"
  | "Gerente"
  | "Comercial"
  | "Financeiro"
  | "Produção"
  | "Expedição"
  | "Atendimento"
  | "Marketing";

export type OrderStatus =
  | "Aguardando pagamento"
  | "Pago"
  | "Em produção"
  | "Separação"
  | "Expedição"
  | "Enviado"
  | "Entregue"
  | "Cancelado";

export type AdminLog = {
  id: string;
  createdAt: string;
  user: string;
  action: string;
  detail: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
};

export type SiteStatItem = {
  id: string;
  value: number;
  suffix: string;
  label: string;
  icon: "users" | "package" | "truck" | "badge" | "stars";
};

export type TextBlock = {
  title: string;
  text: string;
};

export type HomeBenefitItem = {
  title: string;
  description: string;
};

export type HomeTestimonialItem = {
  name: string;
  city: string;
  text: string;
  rating: number;
};

export type HomeCms = {
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  heroImage: string;
  catalogTitle: string;
  catalogSubtitle: string;
  factoryTitle: string;
  factoryText: string;
  testimonialsEnabled: boolean;
  partnersEnabled: boolean;
  footerNote: string;
  logo: string;
  favicon: string;
  partnersLogos: string[];
  partnersTitle: string;
  testimonialPhotos: string[];
  differentialImages: string[];
  footerBg: string;
  slides: HeroSlide[];
  statsTitle: string;
  stats: SiteStatItem[];
  /** Faixa de benefícios sob o hero */
  benefits: HomeBenefitItem[];
  /** Bloco “Porque escolher” */
  whyChooseTitle: string;
  whyChooseItems: TextBlock[];
  /** Destaques */
  featuredTitle: string;
  featuredSubtitle: string;
  /** CTA atacado na home */
  wholesaleCtaTitle: string;
  wholesaleCtaText: string;
  wholesaleCtaButton1: string;
  wholesaleCtaButton2: string;
  /** Depoimentos (textos) */
  testimonialsTitle: string;
  testimonials: HomeTestimonialItem[];
};

export type HeroSlide = {
  id: string;
  imageDesktop: string;
  imageMobile: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta1Label: string;
  cta1Href: string;
  cta2Label: string;
  cta2Href: string;
  order: number;
  durationMs: number;
  active: boolean;
};

export type FactoryCms = {
  title: string;
  subtitle: string;
  history: string;
  mission: string;
  vision: string;
  values: string;
  gallery: string[];
  banner: string;
  historyImage: string;
  teamPhotos: string[];
  productionPhotos: string[];
  timelineImages: string[];
  differentials: TextBlock[];
  lines: string[];
  processSteps: Array<{ n: string; title: string; text: string }>;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

export type WholesaleCms = {
  bannerTitle: string;
  bannerText: string;
  minOrderNote: string;
  benefits: string[];
  faq: Array<{ q: string; a: string }>;
  bannerImage: string;
  background: string;
  benefitImages: string[];
  partnerLogos: string[];
};

export type ContactPageCms = {
  heroTitle: string;
  heroSubtitle: string;
  formTitle: string;
  formSubtitle: string;
  faq: Array<{ q: string; a: string }>;
};

export type QuotePageCms = {
  title: string;
  subtitle: string;
  banner: string;
  trustTitle: string;
  trustItems: string[];
  successTitle: string;
  successText: string;
};

export type ProductOverride = {
  id: string;
  name?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  minQty?: number;
  stock?: number;
  active?: boolean;
  featured?: boolean;
  description?: string;
  image?: string;
  cover?: string;
  gallery?: string[];
  wholesaleImage?: string;
  wholesaleCover?: string;
  wholesaleGallery?: string[];
  video?: string;
  colors?: Array<{ name: string; hex: string }>;
  defaultColor?: string;
};

export type CategoryOverride = {
  id: string;
  banner?: string;
  icon?: string;
  photo?: string;
  featuredImage?: string;
};

export type PageMediaBundle = {
  banner?: string;
  facade?: string;
  mapImage?: string;
  background?: string;
  sideBanner?: string;
  logo?: string;
  footerBg?: string;
  socialIconPack?: string;
};

export type SiteBanner = {
  id: string;
  title: string;
  image: string;
  link: string;
  page: string;
  order: number;
  active: boolean;
};

export type AdminOrder = {
  id: string;
  createdAt: string;
  customerName: string;
  customerType: "CPF" | "CNPJ" | "Guest";
  total: number;
  status: OrderStatus;
  payment: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
};

export type IntegrationSettings = {
  bling: { enabled: boolean; apiKey: string; note: string };
  mercadoPago: { enabled: boolean; publicKey: string; accessToken: string };
  asaas: { enabled: boolean; apiKey: string };
  analytics: { enabled: boolean; measurementId: string };
  tagManager: { enabled: boolean; containerId: string };
  searchConsole: { verificationMeta: string };
  metaPixel: { enabled: boolean; pixelId: string };
  smtp: { host: string; user: string; from: string };
  whatsapp: { number: string };
  googleMaps: { embedUrl: string };
};

export type SeoPage = {
  title: string;
  description: string;
  keywords: string;
  slug: string;
  /** Canonical absoluto ou path; se vazio, usa slug */
  canonical?: string;
  ogImage: string;
  ogTitle?: string;
  ogDescription?: string;
  /** Se false, robots noindex */
  indexable?: boolean;
};

export type AdminCms = {
  home: HomeCms;
  factory: FactoryCms;
  wholesale: WholesaleCms;
  contactPage: ContactPageCms;
  quotePage: QuotePageCms;
  seo: Record<string, SeoPage>;
  productOverrides: ProductOverride[];
  categoryOverrides: CategoryOverride[];
  pageMedia: {
    contact: PageMediaBundle;
    footer: PageMediaBundle;
    login: PageMediaBundle;
    register: PageMediaBundle;
    cart: PageMediaBundle;
    favorites: PageMediaBundle;
  };
  banners: SiteBanner[];
  orders: AdminOrder[];
  coupons: Array<{
    id: string;
    code: string;
    discount: number;
    active: boolean;
  }>;
  users: AdminUser[];
  logs: AdminLog[];
  integrations: IntegrationSettings;
  updatedAt: string;
};

export const defaultAdminCms = (): AdminCms => ({
  home: {
    heroTitle: "Conforto e sofisticação Home Queen",
    heroSubtitle: "Camas box premium com produção própria",
    heroCta: "Ver catálogo",
    heroImage: "/fabrica/cama-03.jpg",
    catalogTitle: "Explore nossas linhas",
    catalogSubtitle: "Catálogo completo de camas box e complementos",
    factoryTitle: "Conheça nossa fábrica",
    factoryText:
      "Processos modernos, controle de qualidade e produção própria.",
    testimonialsEnabled: true,
    partnersEnabled: true,
    footerNote: "Home Queen Camas Box — conforto premium",
    logo: "",
    favicon: "/logo-home-queen.png",
    partnersLogos: [],
    partnersTitle: "Marcas e parceiros",
    testimonialPhotos: [],
    differentialImages: [],
    footerBg: "",
    benefits: [
      {
        title: "Qualidade garantida",
        description: "Matéria-prima selecionada e garantia de fábrica.",
      },
      {
        title: "Entrega rápida",
        description: "Agilidade e segurança para todo Brasil.",
      },
      {
        title: "Tecnologia premium",
        description: "Processos modernos para maior durabilidade.",
      },
      {
        title: "Atendimento especializado",
        description: "Suporte dedicado para melhor experiência.",
      },
    ],
    whyChooseTitle: "Porque escolher a Home Queen",
    whyChooseItems: [
      {
        title: "Qualidade de fábrica",
        text: "Produção própria com materiais selecionados e padrão elevado.",
      },
      {
        title: "Entrega nacional",
        text: "Logística estruturada para todo Brasil com segurança.",
      },
      {
        title: "Experiência premium",
        text: "Design sofisticado, conforto e atendimento especializado.",
      },
    ],
    featuredTitle: "Linhas premium para o seu quarto",
    featuredSubtitle: "",
    wholesaleCtaTitle: "Área exclusiva do atacado",
    wholesaleCtaText:
      "Cadastro com CNPJ, aprovação administrativa, tabelas exclusivas e preços especiais para revendedores.",
    wholesaleCtaButton1: "Quero revender",
    wholesaleCtaButton2: "Login revendedor",
    testimonialsTitle: "Clientes satisfeitos",
    testimonials: [
      {
        name: "Mariana Silva",
        city: "Chapecó - SC",
        text: "Qualidade impressionante e entrega rápida. O quarto ficou com cara de hotel.",
        rating: 5,
      },
      {
        name: "Carlos Mendes",
        city: "Curitiba - PR",
        text: "Comprei para minha loja e o atendimento do atacado foi excelente.",
        rating: 5,
      },
      {
        name: "Ana Paula",
        city: "Porto Alegre - RS",
        text: "Conforto premium e acabamento impecável. Recomendo a Home Queen.",
        rating: 5,
      },
    ],
    slides: [
      {
        id: "slide_1",
        imageDesktop:
          "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1920&q=80",
        imageMobile:
          "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80",
        eyebrow: "Conforto que transforma",
        title: "Excelência em cada detalhe",
        subtitle:
          "Tecnologia de ponta e materiais selecionados para o descanso perfeito da sua família.",
        cta1Label: "Comprar agora",
        cta1Href: "/#nosso-catalogo",
        cta2Label: "Fazer orçamento",
        cta2Href: "/orcamento",
        order: 1,
        durationMs: 6000,
        active: true,
      },
      {
        id: "slide_2",
        imageDesktop: "/hero-home-queen.jpg",
        imageMobile: "/hero-home-queen.jpg",
        eyebrow: "Linha premium",
        title: "Camas box com acabamento sofisticado",
        subtitle:
          "Design elegante, estrutura reforçada e conforto de alto padrão para o seu quarto.",
        cta1Label: "Comprar agora",
        cta1Href: "/#nosso-catalogo",
        cta2Label: "Fazer orçamento",
        cta2Href: "/orcamento",
        order: 2,
        durationMs: 6000,
        active: true,
      },
      {
        id: "slide_3",
        imageDesktop:
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1920&q=80",
        imageMobile:
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80",
        eyebrow: "Atacado e varejo",
        title: "Condições especiais para revendedores",
        subtitle:
          "Cadastre sua empresa, aprove preços exclusivos e monte orçamentos personalizados.",
        cta1Label: "Portal atacado",
        cta1Href: "/atacado",
        cta2Label: "Fazer orçamento",
        cta2Href: "/orcamento",
        order: 3,
        durationMs: 6000,
        active: true,
      },
    ],
    statsTitle: "Nossos números falam por nós",
    stats: [
      {
        id: "clientes",
        value: 15000,
        suffix: "+",
        label: "Clientes atendidos",
        icon: "users",
      },
      {
        id: "produtos",
        value: 280000,
        suffix: "+",
        label: "Produtos fabricados",
        icon: "package",
      },
      {
        id: "entregas",
        value: 52000,
        suffix: "+",
        label: "Entregas realizadas",
        icon: "truck",
      },
      {
        id: "anos",
        value: 10,
        suffix: "+",
        label: "Anos de mercado",
        icon: "badge",
      },
      {
        id: "satisfacao",
        value: 98,
        suffix: "%",
        label: "Índice de satisfação",
        icon: "stars",
      },
    ],
  },
  factory: {
    title: "Nossa Fábrica",
    subtitle: "Produção própria, qualidade e acabamento premium.",
    history: "A Home Queen nasceu da paixão por conforto e acabamento premium.",
    mission: "Entregar conforto premium com excelência em cada detalhe.",
    vision: "Ser referência nacional em camas box de fábrica própria.",
    values: "Qualidade, transparência, atendimento e inovação.",
    gallery: [
      "/fabrica/cama-01.jpg",
      "/fabrica/cama-02.jpg",
      "/fabrica/cama-03.jpg",
      "/fabrica/cama-04.jpg",
      "/fabrica/cama-05.jpg",
    ],
    banner:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1920&q=80",
    historyImage:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
    teamPhotos: [],
    productionPhotos: [
      "/fabrica/cama-01.jpg",
      "/fabrica/cama-02.jpg",
      "/fabrica/cama-03.jpg",
      "/fabrica/cama-04.jpg",
      "/fabrica/cama-05.jpg",
    ],
    timelineImages: [],
    differentials: [
      {
        title: "Fábrica própria",
        text: "Produzimos camas box e baú com controle total de qualidade.",
      },
      {
        title: "Qualidade premium",
        text: "Acabamento sofisticado e materiais selecionados.",
      },
      {
        title: "Entrega nacional",
        text: "Enviamos para todo o Brasil com segurança.",
      },
    ],
    lines: ["Camas Box", "Camas Baú", "Solteiro & Casal", "Queen & King"],
    processSteps: [
      {
        n: "01",
        title: "Matéria-prima",
        text: "Selecionamos os melhores materiais do mercado.",
      },
      {
        n: "02",
        title: "Produção",
        text: "Tecnologia e precisão em cada etapa do processo.",
      },
      {
        n: "03",
        title: "Montagem",
        text: "Montagem realizada por profissionais especializados.",
      },
      {
        n: "04",
        title: "Controle de qualidade",
        text: "Inspeção rigorosa para garantir excelência.",
      },
      {
        n: "05",
        title: "Expedição",
        text: "Embalagem segura e envio para todo o Brasil.",
      },
    ],
    ctaTitle: "Quer conhecer os produtos?",
    ctaText: "Explore o catálogo e solicite um orçamento personalizado.",
    ctaButton: "Ver catálogo",
  },
  wholesale: {
    bannerTitle: "Portal do Revendedor",
    bannerText: "Preços exclusivos diretamente da fábrica.",
    minOrderNote: "Pedido mínimo configurável por produto e por cliente.",
    benefits: [
      "Compra direta da fábrica",
      "Tabela atacado",
      "Entrega nacional",
      "Consultor comercial",
    ],
    faq: [
      {
        q: "Como me tornar revendedor?",
        a: "Cadastre o CNPJ no portal e aguarde aprovação.",
      },
    ],
    bannerImage: "",
    background: "",
    benefitImages: [],
    partnerLogos: [],
  },
  contactPage: {
    heroTitle: "Fale com a Home Queen",
    heroSubtitle: "Atendimento comercial e suporte para varejo e atacado.",
    formTitle: "Envie sua mensagem",
    formSubtitle: "Retornamos o mais rápido possível.",
    faq: [
      {
        q: "Qual o prazo de entrega?",
        a: "O prazo varia por região e volume. Consulte o comercial.",
      },
      {
        q: "Vocês atendem atacado?",
        a: "Sim. Revendedores podem se cadastrar no portal Atacado.",
      },
    ],
  },
  quotePage: {
    title: "Solicite um orçamento",
    subtitle: "Monte o pedido com as características do seu produto.",
    banner: "",
    trustTitle: "Por que pedir orçamento conosco",
    trustItems: [
      "Fábrica própria",
      "Preço direto",
      "Atendimento personalizado",
      "Entrega em todo o Brasil",
    ],
    successTitle: "Orçamento enviado!",
    successText: "Nossa equipe entrará em contato em breve.",
  },
  seo: {
    home: {
      title: "Home Queen | Camas Box Premium e Baús",
      description:
        "Conheça as camas box premium, baús, colchões e acessórios Home Queen. Qualidade, conforto e entrega para todo o Brasil.",
      keywords: "cama box, home queen, colchão, baú, camas premium",
      slug: "/",
      canonical: "/",
      ogImage: "/hero-home-queen.jpg",
      ogTitle: "Home Queen | Camas Box Premium e Baús",
      ogDescription:
        "Camas box premium, baús e colchões com fábrica própria e entrega nacional.",
      indexable: true,
    },
    products: {
      title: "Produtos | Home Queen",
      description:
        "Catálogo Home Queen de camas box, box baú, colchões, cabeceiras e acessórios com qualidade de fábrica.",
      keywords: "produtos, cama box, catálogo, home queen",
      slug: "/",
      canonical: "/",
      ogImage: "/hero-home-queen.jpg",
      indexable: true,
    },
    wholesale: {
      title: "Revenda Home Queen",
      description:
        "Portal de revenda Home Queen para atacado: condições especiais, preços exclusivos e orçamentos personalizados.",
      keywords: "atacado, revenda, revendedor, cnpj, home queen",
      slug: "/atacado",
      canonical: "/atacado",
      ogImage: "/hero-home-queen.jpg",
      indexable: true,
    },
    factory: {
      title: "Sobre a Home Queen",
      description:
        "Conheça a fábrica e a história da Home Queen — produção própria, qualidade premium e camas box para todo o Brasil.",
      keywords: "sobre, fábrica, produção, home queen",
      slug: "/sobre",
      canonical: "/sobre",
      ogImage: "/fabrica/cama-03.jpg",
      indexable: true,
    },
    contact: {
      title: "Contato | Home Queen",
      description:
        "Fale com a equipe Home Queen: WhatsApp, telefone e formulário de contato para orçamentos e atendimento.",
      keywords: "contato, whatsapp, atendimento, home queen",
      slug: "/contato",
      canonical: "/contato",
      ogImage: "/hero-home-queen.jpg",
      indexable: true,
    },
    quote: {
      title: "Orçamento | Home Queen",
      description:
        "Solicite um orçamento personalizado de camas box e produtos Home Queen com atendimento especializado.",
      keywords: "orçamento, cama box, pedido",
      slug: "/orcamento",
      canonical: "/orcamento",
      ogImage: "/hero-home-queen.jpg",
      indexable: true,
    },
  },
  productOverrides: [],
  categoryOverrides: [],
  pageMedia: {
    contact: {},
    footer: {},
    login: {},
    register: {},
    cart: {},
    favorites: {},
  },
  banners: [],
  orders: [],
  coupons: [
    { id: "cp1", code: "HOME10", discount: 10, active: true },
    { id: "cp2", code: "QUEEN15", discount: 15, active: true },
  ],
  users: [
    {
      id: "u1",
      name: "Admin Home Queen",
      email: "admin@homequeen.com.br",
      role: "Administrador",
      active: true,
    },
  ],
  logs: [],
  integrations: {
    bling: {
      enabled: false,
      apiKey: "",
      note: "Sincronização automática de produtos, categorias, estoque, preços, SKU e status",
    },
    mercadoPago: { enabled: false, publicKey: "", accessToken: "" },
    asaas: { enabled: false, apiKey: "" },
    analytics: { enabled: false, measurementId: "" },
    tagManager: { enabled: false, containerId: "" },
    searchConsole: { verificationMeta: "" },
    metaPixel: { enabled: false, pixelId: "" },
    smtp: { host: "", user: "", from: "contato@homequeen.com.br" },
    whatsapp: { number: "5549999999999" },
    googleMaps: { embedUrl: "" },
  },
  updatedAt: new Date().toISOString(),
});
