export type CepAddress = {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
};

export function formatCep(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) return null;

  return {
    cep: formatCep(digits),
    street: data.logradouro || "",
    district: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}
