import type { CatalogCategoryId } from "@/data/homeCatalog";

/** Desconto padrão atacado sobre o preço varejo (sem tabela por cliente). */
export const DEFAULT_WHOLESALE_DISCOUNT = 0.28;

const MIN_QTY_BY_CATEGORY: Partial<
  Record<Exclude<CatalogCategoryId, "todos">, number>
> = {
  "camas-box": 4,
  "camas-box-bau": 5,
  "camas-com-colchao": 2,
  colchoes: 3,
  cabeceiras: 6,
  bases: 4,
  baus: 6,
  acessorios: 8,
};

export function getWholesaleUnit(
  retailUnit: number,
  discountPercent?: number | null,
) {
  const rate =
    typeof discountPercent === "number" && discountPercent > 0
      ? discountPercent / 100
      : DEFAULT_WHOLESALE_DISCOUNT;
  return Math.max(1, Math.round(retailUnit * (1 - rate)));
}

export function getMinQty(
  categoryId?: string | null,
  override?: number | null,
) {
  if (typeof override === "number" && override > 0) return override;
  if (!categoryId || categoryId === "todos") return 3;
  return (
    MIN_QTY_BY_CATEGORY[categoryId as Exclude<CatalogCategoryId, "todos">] ?? 3
  );
}

export function getSavings(retailUnit: number, wholesaleUnit: number) {
  return Math.max(0, retailUnit - wholesaleUnit);
}

export function formatCnpj(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCpf(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}
