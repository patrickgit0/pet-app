'use client';

import { useState, type ReactNode } from 'react';

/** No celular os filtros ficam recolhidos atrás de um botão; no desktop aparecem sempre na lateral. */
export function FilterPanel({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="btn-ghost w-full bg-white lg:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {open ? 'Fechar filtros' : 'Filtros'}
        {activeCount > 0 && <span className="rounded-full bg-brand px-2 text-xs text-white">{activeCount}</span>}
      </button>
      <div className={open ? 'contents' : 'max-lg:hidden contents'}>{children}</div>
    </>
  );
}
