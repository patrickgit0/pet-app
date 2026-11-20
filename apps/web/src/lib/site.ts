import { createClient as createSupabase } from '@supabase/supabase-js';
import type { Database } from '@adotai/shared';

/** Endereço público do site (links absolutos: sitemap, dados estruturados, e-mails). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://adotaiapp.vercel.app'))
  .replace(/\/$/, '');

/**
 * Quem opera o Adotaí (controlador dos dados, LGPD art. 9º) e o canal de contato/privacidade.
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
  'cachorro-em-ribeirao-preto': { species: 'dog', title: 'Cachorros para adoção em Ribeirão Preto', h1: 'Adotar cachorro em Ribeirão Preto' },
  'gato-em-ribeirao-preto': { species: 'cat', title: 'Gatos para adoção em Ribeirão Preto', h1: 'Adotar gato em Ribeirão Preto' },
  'filhotes-em-ribeirao-preto': { species: null, ages: ['puppy'], title: 'Filhotes para adoção em Ribeirão Preto', h1: 'Adotar filhote em Ribeirão Preto' },
  'outros-animais-em-ribeirao-preto': { species: 'other', title: 'Coelhos, aves e outros animais para adoção em Ribeirão Preto', h1: 'Adotar outros animais em Ribeirão Preto' },
} as const satisfies Record<string, { species: 'dog' | 'cat' | 'other' | null; ages?: readonly string[]; title: string; h1: string }>;
export type LandingSlug = keyof typeof LANDINGS;
