import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMyNgo } from '@/lib/ngo';
import { initials } from '@/lib/utils';
import { getI18n, pageTitle } from '@/i18n/server';

export const generateMetadata = pageTitle('Painel da ONG');

const MENU = [
  { href: '/painel', label: 'Visão geral' },
  { href: '/painel/animais', label: 'Animais' },
  { href: '/painel/pedidos', label: 'Candidatos' },
  { href: '/mensagens', label: 'Mensagens' },
  { href: '/painel/pos-adocao', label: 'Pós-adoção' },
  { href: '/painel/feiras', label: 'Feiras' },
  { href: '/painel/lar-temporario', label: 'Lar temporário' },
  { href: '/painel/ong', label: 'Dados da ONG' },
];

/** Celular: cabeçalho compacto da ONG + abas roláveis. Desktop: menu lateral verde. */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { ngo } = await getMyNgo();
  if (!ngo) redirect('/sou-ong');
  const { t } = await getI18n();

  return (
    <div className="flex min-h-[80vh] flex-col lg:flex-row">
      <nav className="flex flex-col gap-1 bg-panel px-4 py-3 text-white lg:w-60 lg:shrink-0 lg:px-3.5 lg:py-5">
        <div className="flex items-center gap-2.5 lg:px-2 lg:pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-extrabold text-brand">{initials(ngo.name)}</span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-extrabold">{ngo.name}</span>
            <span className="text-xs text-[#B9D3CC]">{ngo.verified_at ? t('ONG verificada') : t('Verificação pendente')}</span>
          </span>
        </div>
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pt-2 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:px-0 lg:pt-0">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="flex min-h-10 shrink-0 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-[#D6E5E1] hover:bg-white/10 hover:text-white lg:min-h-11">
              {t(m.label)}
            </Link>
          ))}
        </div>
      </nav>
      <div className="min-w-0 flex-1 p-4 sm:p-6">
        {!ngo.verified_at && (
          <p className="mb-5 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
            {t('Sua ONG está em verificação. Você já pode cadastrar animais; eles aparecem na busca com o selo depois da aprovação.')}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
