'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';

const NAME = 'aviso_cookies';

/** Aviso discreto: o site só usa cookies essenciais (login, idioma, local da busca), sem rastreamento. */
export function CookieNotice() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(!document.cookie.split('; ').some((c) => c.startsWith(`${NAME}=`))); }, []);
  if (!show) return null;
  return (
    <div role="region" aria-label={t('Aviso de cookies')}
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white p-3 text-[13px] shadow-lg sm:p-4 sm:text-sm print:hidden">
      <p className="flex-1 text-ink-2">
        {t('Usamos só cookies essenciais: para manter você logado, lembrar o idioma e o local da busca. Nada de propaganda ou rastreamento.')}{' '}
        <Link href="/privacidade" className="font-semibold text-brand">{t('Saiba mais')}</Link>
      </p>
      <button type="button" className="btn-primary min-h-10 shrink-0 px-3 sm:px-4"
        onClick={() => { document.cookie = `${NAME}=1; path=/; max-age=31536000; samesite=lax`; setShow(false); }}>
        {t('Entendi')}
      </button>
    </div>
  );
}
