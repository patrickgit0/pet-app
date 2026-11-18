import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn' | 'bad'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-field text-muted',
    good: 'bg-brand-soft text-brand-dark',
    warn: 'bg-accent-soft text-accent-ink',
    bad: 'bg-red-50 text-red-800',
  };
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', tones[tone])}>{children}</span>;
}

/** Barra de busca/filtros via GET (funciona sem JS). */
export function SearchBar({ q, placeholder, children }: { q?: string; placeholder: string; children?: ReactNode }) {
  return (
    <form method="get" className="mb-4 flex flex-wrap gap-2">
      <input name="q" type="search" defaultValue={q} placeholder={placeholder} className="field h-11 min-w-0 flex-[1_1_220px] text-sm" />
      {children}
      <button className="btn-primary min-h-11">Buscar</button>
    </form>
  );
}

export function Pager({ page, total, size, href }: { page: number; total: number; size: number; href: (p: number) => string }) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-center gap-2 text-sm" aria-label="Paginação">
      {page > 1 && <Link className="btn-ghost min-h-10 bg-white" href={href(page - 1)}>Anterior</Link>}
      <span className="text-muted">Página {page} de {pages}</span>
      {page < pages && <Link className="btn-ghost min-h-10 bg-white" href={href(page + 1)}>Próxima</Link>}
    </nav>
  );
}

export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—');
export const daysSince = (d: string | null | undefined) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null);
