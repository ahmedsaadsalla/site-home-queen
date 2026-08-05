export type CartItem = {
  key: string;
  productId: string;
  name: string;
  image: string;
  size?: string;
  color?: string;
  type?: string;
  mattress?: string;
  unitPrice: number;
  quantity: number;
  category?: string;
  stock?: number;
  minQty?: number;
  mode?: "retail" | "wholesale";
  retailUnitPrice?: number;
};

export type FavoriteItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  sizeLabel?: string;
  category?: string;
};

export type ShopDrawer = null | "cart" | "favorites";

export function cartItemKey(input: {
  productId: string;
  size?: string;
  color?: string;
  type?: string;
  mattress?: string;
}) {
  return [
    input.productId,
    input.size || "",
    input.color || "",
    input.type || "",
    input.mattress || "",
  ].join("|");
}
