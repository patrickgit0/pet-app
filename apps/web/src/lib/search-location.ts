import { cookies } from 'next/headers';

import { SEARCH_LOCATION_COOKIE } from './cookie-names';

/** Centro da busca escolhido pela pessoa (localização do navegador ou CEP). Fica em cookie para não poluir a URL. */

export type SearchLocation = { lat: number; lng: number; label: string | null };

export async function readSearchLocation(): Promise<SearchLocation | null> {
  const raw = (await cookies()).get(SEARCH_LOCATION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    if (typeof v?.lat !== 'number' || typeof v?.lng !== 'number' || Math.abs(v.lat) > 90 || Math.abs(v.lng) > 180) return null;
    return { lat: v.lat, lng: v.lng, label: typeof v.label === 'string' ? v.label.slice(0, 80) : null };
  } catch {
    return null;
  }
}
