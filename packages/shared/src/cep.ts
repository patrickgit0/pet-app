/**
 * CEP -> endereço + coordenadas, só com serviços gratuitos e sem chave:
 *  1. BrasilAPI v2 (traz coordenadas quando disponíveis)
 *  2. ViaCEP (fallback de endereço)
 *  3. Nominatim/OpenStreetMap (fallback de coordenadas; limite de 1 req/s — usar só nesta ação do usuário)
 */
export interface CepResult {
  cep: string;
  state: string;
  city: string;
  neighborhood: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;
}

export function formatCep(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 8);
  return v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
}

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

export async function lookupCep(rawCep: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<CepResult | null> {
  const cep = rawCep.replace(/\D/g, '');
  if (cep.length !== 8) return null;

  let result: CepResult | null = null;

  try {
    const res = await fetchImpl(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (res.ok) {
      const d = (await res.json()) as {
        state: string; city: string; neighborhood?: string; street?: string;
        location?: { coordinates?: { latitude?: string; longitude?: string } };
      };
      const lat = Number(d.location?.coordinates?.latitude);
      const lng = Number(d.location?.coordinates?.longitude);
      result = {
        cep, state: d.state, city: d.city,
        neighborhood: d.neighborhood || null, street: d.street || null,
        lat: Number.isFinite(lat) && lat !== 0 ? lat : null,
        lng: Number.isFinite(lng) && lng !== 0 ? lng : null,
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
            neighborhood: d.bairro || null, street: d.logradouro || null, lat: null, lng: null,
          };
        }
      }
    } catch {
      /* sem endereço */
    }
  }

  if (result && (result.lat === null || result.lng === null)) {
    const coords = await geocode(result, fetchImpl);
    if (coords) Object.assign(result, coords);
  }
  return result;
}

async function geocode(r: CepResult, fetchImpl: FetchLike): Promise<{ lat: number; lng: number } | null> {
  const q = [r.street, r.neighborhood, r.city, r.state, 'Brasil'].filter(Boolean).join(', ');
  try {
    const res = await fetchImpl(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`,
      { headers: { 'Accept-Language': 'pt-BR' } },
    );
    if (!res.ok) return null;
    const list = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!list.length) return null;
    return { lat: Number(list[0].lat), lng: Number(list[0].lon) };
  } catch {
    return null;
  }
}
