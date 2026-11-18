import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMyNgo } from '@/lib/ngo';
import { initials } from '@/lib/utils';

export const metadata = { title: 'Painel da ONG' };

const MENU = [
  { href: '/painel', label: 'Visão geral' },
  { href: '/painel/animais', label: 'Animais' },
  { href: '/painel/pedidos', label: 'Candidatos' },
  { href: '/mensagens', label: 'Mensagens' },
  { href: '/painel/pos-adocao', label: 'Pós-adoção' },
  { href: '/painel/ong', label: 'Dados da ONG' },
];

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { ngo } = await getMyNgo();
  if (!ngo) redirect('/sou-ong');

  return (
    <div className="flex min-h-[80vh] flex-wrap">
      <nav className="flex max-w-full flex-[1_1_220px] flex-col gap-1 bg-panel px-3.5 py-5 text-white">
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-extrabold text-brand">{initials(ngo.name)}</span>
          <span className="flex flex-col">
            <span className="text-[15px] font-extrabold">{ngo.name}</span>
            <span className="text-xs text-[#B9D3CC]">{ngo.verified_at ? 'ONG verificada' : 'Verificação pendente'}</span>
          </span>
        </div>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#D6E5E1] hover:bg-white/10 hover:text-white">
            {m.label}
          </Link>
        ))}
      </nav>
      <div className="min-w-0 flex-[999_1_560px] p-6">
        {!ngo.verified_at && (
          <p className="mb-5 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
            Sua ONG está em verificação. Você já pode cadastrar animais; eles aparecem na busca com o selo depois da aprovação.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
