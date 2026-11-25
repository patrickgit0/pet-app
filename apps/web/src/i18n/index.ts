import type { Lang } from '@viralar/shared';
import { EN } from './en';

export type { Lang };
export type Vars = Record<string, string | number | null | undefined>;
export type T = (text: string, vars?: Vars) => string;

export const LANG_COOKIE = 'lang';
export const LANGS: Lang[] = ['pt', 'en'];

/**
 * A chave é o próprio texto em português. Em inglês, busca no dicionário; se faltar, mostra o português
 * (nunca quebra a tela). Variáveis: t('Até {r} km', { r: 10 }).
 */
export function translate(lang: Lang, text: string, vars?: Vars): string {
  let out = lang === 'en' ? (EN[text] ?? text) : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v == null ? '' : String(v));
  return out;
}

export const makeT = (lang: Lang): T => (text, vars) => translate(lang, text, vars);
export const localeOf = (lang: Lang) => (lang === 'en' ? 'en-US' : 'pt-BR');
export const toLang = (v: string | undefined | null): Lang => (v === 'en' ? 'en' : 'pt');
