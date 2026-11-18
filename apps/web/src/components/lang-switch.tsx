'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LANG_COOKIE, type Lang } from '@/i18n';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

/** Seletor PT | EN: guarda a escolha num cookie por 1 ano e recarrega os textos. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: Lang) {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  }

  return (
    <div role="group" aria-label="Idioma / Language" className={cn('inline-flex rounded-full bg-field p-1 text-xs font-bold', pending && 'opacity-60', className)}>
      {(['pt', 'en'] as const).map((l) => (
        <button key={l} type="button" onClick={() => choose(l)} aria-pressed={lang === l} lang={l === 'en' ? 'en' : 'pt-BR'}
          className={cn('min-h-8 rounded-full px-3', lang === l ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {l === 'pt' ? 'PT' : 'EN'}
        </button>
      ))}
    </div>
  );
}
