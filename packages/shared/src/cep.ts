/**
 * CEP -> endereço + coordenadas, só com serviços gratuitos e sem chave:
 *  1. BrasilAPI v2 (endereço; a coordenada dela muitas vezes é o CENTRO DA CIDADE, não a rua)
 *  2. ViaCEP (fallback de endereço)
 *  3. Nominatim/OpenStreetMap: rua + cidade + UF (sem o bairro) para achar o ponto da rua.
 *     Limite de 1 req/s — chamar só a partir de uma ação da pessoa (digitar o CEP, clicar).
 *
 * Ordem do ponto: rua no Nominatim → ponto da BrasilAPI → bairro + cidade + UF no Nominatim.
 * O ponto cai na rua certa, não no número: em ruas compridas pode haver algumas centenas de metros de diferença.
 */
export interface CepResult {
  cep: string;
  state: string;
  city: string;
  neighborhood: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;
  /** De onde veio o ponto: rua (Nominatim), cep (BrasilAPI, pode ser o centro da cidade) ou bairro (Nominatim). */
  precision: 'street' | 'cep' | 'neighborhood' | null;
}

export function formatCep(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 8);
  return v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
}

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

export interface LookupCepOptions {
  /** false = não chama o Nominatim (só endereço e o ponto da BrasilAPI). Padrão: true. */
  geocode?: boolean;
  /** Espera entre duas chamadas seguidas ao Nominatim (limite de 1 req/s). Padrão: 1100 ms. */
  nominatimGapMs?: number;
}

export async function lookupCep(
  rawCep: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  opts: LookupCepOptions = {},
): Promise<CepResult | null> {
  const cep = rawCep.replace(/\D/g, '');
  if (cep.length !== 8) return null;

  let result: CepResult | null = null;
  let cepPoint: { lat: number; lng: number } | null = null;

  try {
    const res = await fetchImpl(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (res.ok) {
      const d = (await res.json()) as {
        state: string; city: string; neighborhood?: string; street?: string;
        location?: { coordinates?: { latitude?: string | number; longitude?: string | number } };
      };
      const lat = Number(d.location?.coordinates?.latitude);
      const lng = Number(d.location?.coordinates?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) cepPoint = { lat, lng };
      result = {
        cep, state: d.state, city: d.city,
        neighborhood: d.neighborhood || null, street: d.street || null,
        lat: null, lng: null, precision: null,
      };
    }
  } catch {
    /* tenta o próximo */
  }

  if (!result) {
    try {
      const res = await fetchImpl(`https://viacep.com.br/ws/${cep}/json/`);
      if (res.ok) {
        const d = (await res.json()) as { erro?: boolean; uf: string; localidade: string; bairro?: string; logradouro?: string };
        if (!d.erro) {
          result = {
            cep, state: d.uf, city: d.localidade,
            neighborhood: d.bairro || null, street: d.logradouro || null,
            lat: null, lng: null, precision: null,
          };
        }
      }
    } catch {
      /* sem endereço */
    }
  }
  if (!result) return null;

  const set = (p: { lat: number; lng: number }, precision: CepResult['precision']) =>
    Object.assign(result!, { lat: p.lat, lng: p.lng, precision });

  if (opts.geocode === false) {
    if (cepPoint) set(cepPoint, 'cep');
    return result;
  }

  // 1. Rua + cidade + UF (sem bairro: o bairro dos Correios muitas vezes não bate com o do OpenStreetMap)
  const street = result.street ? await nominatim([result.street, result.city, result.state, 'Brasil'], fetchImpl) : null;
  if (street) return set(street, 'street');

  // 2. Ponto da BrasilAPI
  if (cepPoint) return set(cepPoint, 'cep');

  // 3. Bairro + cidade + UF
  if (result.neighborhood) {
    if (result.street) await wait(opts.nominatimGapMs ?? 1100); // já houve uma chamada agora há pouco
    const hood = await nominatim([result.neighborhood, result.city, result.state, 'Brasil'], fetchImpl);
    if (hood) return set(hood, 'neighborhood');
  }
  return result;
}

const wait = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

async function nominatim(parts: string[], fetchImpl: FetchLike): Promise<{ lat: number; lng: number } | null> {
  const q = parts.filter(Boolean).join(', ');
  try {
    const res = await fetchImpl(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`,
      { headers: { 'Accept-Language': 'pt-BR' } },
    );
    if (!res.ok) return null;
    const list = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!list.length) return null;
    const lat = Number(list[0].lat);
    const lng = Number(list[0].lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}
