import { createClient as createSupabase } from '@supabase/supabase-js';
import type { Database } from '@viralar/shared';

/** Endereço público do site (links absolutos: sitemap, dados estruturados, e-mails). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://viralarpet.vercel.app'))
  .replace(/\/$/, '');

/**
 * Quem opera o Vira Lar (controlador dos dados, LGPD art. 9º) e o canal de contato/privacidade.
 * Definidos na Vercel; enquanto não houver, as páginas legais mostram o aviso entre colchetes.
 */
export const OPERATOR_NAME = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || '';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || '';

/** Cliente sem sessão (só dados públicos), para sitemap e páginas que não dependem do usuário. */
export function publicClient() {
  return createSupabase<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Páginas locais de SEO: /adotar/<slug>. */
export const LANDINGS = {
  'cachorro-em-franca': { species: 'dog', title: 'Cachorros para adoção em Franca', h1: 'Adotar cachorro em Franca' },
  'gato-em-franca': { species: 'cat', title: 'Gatos para adoção em Franca', h1: 'Adotar gato em Franca' },
  'filhotes-em-franca': { species: null, ages: ['puppy'], title: 'Filhotes para adoção em Franca', h1: 'Adotar filhote em Franca' },
  'outros-animais-em-franca': { species: 'other', title: 'Coelhos, aves e outros animais para adoção em Franca', h1: 'Adotar outros animais em Franca' },
} as const satisfies Record<string, { species: 'dog' | 'cat' | 'other' | null; ages?: readonly string[]; title: string; h1: string }>;
export type LandingSlug = keyof typeof LANDINGS;
