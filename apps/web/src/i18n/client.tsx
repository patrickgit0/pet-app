'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { localeOf, makeT, type Lang } from './index';

const LangContext = createContext<Lang>('pt');

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** Para Client Components: const { t, lang, locale } = useI18n() */
export function useI18n() {
  const lang = useContext(LangContext);
  return useMemo(() => ({ lang, t: makeT(lang), locale: localeOf(lang) }), [lang]);
}
