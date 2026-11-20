import type { MetadataRoute } from 'next';
import { animalPath } from '@adotai/shared';
import { LANDINGS, SITE_URL, publicClient } from '@/lib/site';

export const revalidate = 3600; // regenera a cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = publicClient();
  const [{ data: animals }, { data: ngos }] = await Promise.all([
    supabase.from('animals').select('id, name, code, updated_at').eq('status', 'available').limit(5000),
    supabase.from('ngos').select('slug, updated_at').limit(1000),
  ]);
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/ongs`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    ...Object.keys(LANDINGS).map((slug) => ({ url: `${SITE_URL}/adotar/${slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })),
    ...(animals ?? []).map((a) => ({ url: SITE_URL + animalPath(a), lastModified: new Date(a.updated_at), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...(ngos ?? []).map((n) => ({ url: `${SITE_URL}/ongs/${n.slug}`, lastModified: new Date(n.updated_at), changeFrequency: 'weekly' as const, priority: 0.6 })),
    { url: `${SITE_URL}/feiras`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/lar-temporario`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/sou-ong`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/guia-ong`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/termos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/termo-de-adocao`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
