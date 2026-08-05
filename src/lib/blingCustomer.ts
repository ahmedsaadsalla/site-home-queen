import type { CustomerRecord } from "@/data/customer";

/**
 * Stub da integração Bling ERP.
 * Após a 1ª compra: cria contato, vincula pedidos e sincroniza nome/CPF/e-mail/endereço.
 */
export async function syncCustomerToBlingAfterFirstPurchase(
  customer: CustomerRecord,
  orderId: string,
): Promise<{ blingContactId: string; blingOrderId: string }> {
  const address = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];

  const payload = {
    nome: customer.name,
    cpf: customer.cpf,
    email: customer.email,
    telefone: customer.phone || customer.whatsapp,
    endereco: address
      ? {
          cep: address.cep,
          logradouro: address.street,
          numero: address.number,
          complemento: address.complement || "",
          bairro: address.district,
          municipio: address.city,
          uf: address.state,
        }
      : null,
    pedidoId: orderId,
  };

  // TODO: POST real para API Bling quando credenciais estiverem configuradas.
  console.info("[Bling stub] sincronizar cliente após 1ª compra", payload);

  return {
    blingContactId:
      customer.blingContactId || `bling_c_${customer.id.replace(/^c_/, "")}`,
    blingOrderId: `bling_o_${orderId}`,
  };
}
