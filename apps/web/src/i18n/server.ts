import { cookies } from 'next/headers';
import { LANG_COOKIE, localeOf, makeT, toLang } from './index';

/** Idioma escolhido (cookie "lang"), para Server Components e Server Actions. */
export async function getLang() {
  return toLang((await cookies()).get(LANG_COOKIE)?.value);
}

export async function getI18n() {
  const lang = await getLang();
  return { lang, t: makeT(lang), locale: localeOf(lang) };
}

/** Título de página traduzido: export const generateMetadata = pageTitle('Mensagens') */
export const pageTitle = (title: string) => async () => ({ title: (await getI18n()).t(title) });
