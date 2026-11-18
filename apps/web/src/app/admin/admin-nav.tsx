'use client';

import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const MENU = [
  { href: '/admin', label: 'Visão geral' },
  { href: '/admin/ongs', label: 'ONGs' },
  { href: '/admin/animais', label: 'Animais' },
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/adocoes', label: 'Adoções' },
  { href: '/admin/denuncias', label: 'Denúncias' },
];

/** Celular: abas roláveis no topo. Desktop: menu lateral. */
export function AdminNav() {
  const path = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label={t('Administração')} className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:w-52 lg:shrink-0 lg:flex-col lg:px-0">
      <span className="hidden px-3 pb-2 text-xs font-bold tracking-wide text-muted uppercase lg:block">{t('Administração')}</span>
      {MENU.map((m) => {
        const active = m.href === '/admin' ? path === '/admin' : path.startsWith(m.href);
        return (
          <Link key={m.href} href={m.href} aria-current={active ? 'page' : undefined}
            className={cn('flex min-h-10 shrink-0 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap',
              active ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-field lg:bg-transparent lg:ring-0')}>
            {t(m.label)}
          </Link>
        );
      })}
    </nav>
  );
}
