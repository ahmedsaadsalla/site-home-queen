export type MediaFolder =
  | "home"
  | "produtos"
  | "categorias"
  | "fabrica"
  | "contato"
  | "atacado"
  | "blog"
  | "banners"
  | "rodape"
  | "login"
  | "cadastro"
  | "carrinho"
  | "favoritos"
  | "geral";

export type MediaAsset = {
  id: string;
  name: string;
  originalName: string;
  url: string;
  thumbUrl: string;
  webpUrl?: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  folder: MediaFolder;
  productId?: string;
  categoryId?: string;
  usedIn: string[];
  createdAt: string;
  updatedAt: string;
};

export type MediaLibrary = {
  assets: MediaAsset[];
  updatedAt: string;
};

export const MEDIA_FOLDERS: MediaFolder[] = [
  "home",
  "produtos",
  "categorias",
  "fabrica",
  "contato",
  "atacado",
  "blog",
  "banners",
  "rodape",
  "login",
  "cadastro",
  "carrinho",
  "favoritos",
  "geral",
];

export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const emptyMediaLibrary = (): MediaLibrary => ({
  assets: [],
  updatedAt: new Date().toISOString(),
});
