import type { AdminCategory, AdminProduct } from "@/data/adminCatalog";

/**
 * Sincronização automática com Bling ERP.
 * Quando a integração estiver habilitada e com API key, dispara o stub (ou API real).
 * Sem botão de sincronização manual — chamado em toda criação/edição/exclusão.
 */
export async function syncCatalogEntityToBling(opts: {
  kind: "product" | "category";
  entity: AdminProduct | AdminCategory;
  action: string;
  enabled: boolean;
  apiKey: string;
}): Promise<{ ok: boolean; remoteId?: string }> {
  if (!opts.enabled) {
    return { ok: true, remoteId: undefined };
  }

  const payload = {
    provider: "bling",
    kind: opts.kind,
    action: opts.action,
    at: new Date().toISOString(),
    apiKeyPresent: Boolean(opts.apiKey),
    entity: {
      id: opts.entity.id,
      name: opts.entity.name,
      ...(opts.kind === "product"
        ? {
            sku: (opts.entity as AdminProduct).sku,
            code: (opts.entity as AdminProduct).code,
            stock: (opts.entity as AdminProduct).stock,
            price: (opts.entity as AdminProduct).retailPrice,
            status: (opts.entity as AdminProduct).active ? "active" : "inactive",
            categoryId: (opts.entity as AdminProduct).categoryId,
          }
        : {
            slug: (opts.entity as AdminCategory).slug,
            status: (opts.entity as AdminCategory).active ? "active" : "inactive",
          }),
    },
  };

  // TODO: substituir por chamada real à API Bling quando as credenciais estiverem ativas.
  console.info("[Bling auto-sync]", payload);
  return {
    ok: true,
    remoteId: `bling_${opts.kind}_${opts.entity.id}`,
  };
}
