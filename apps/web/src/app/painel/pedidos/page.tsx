import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { REQUEST_STATUS_LABEL, type RequestStatus } from '@adotai/shared';
import { getMyNgo } from '@/lib/ngo';

const TABS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  { key: 'abertos', label: 'Em aberto', statuses: ['sent', 'reviewing', 'visit_scheduled'] },
  { key: 'aprovados', label: 'Aprovados', statuses: ['approved'] },
  { key: 'encerrados', label: 'Encerrados', statuses: ['rejected', 'cancelled'] },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba = 'abertos' } = await searchParams;
  const tab = TABS.find((x) => x.key === aba) ?? TABS[0];
  const { supabase, ngo } = await getMyNgo();
  const { t, locale } = await getI18n();
  const { data } = await supabase
    .from('adoption_requests')
    .select('id, status, created_at, animals(name), profiles!adoption_requests_adopter_id_fkey(full_name, home_type, neighborhood)')
    .eq('ngo_id', ngo!.id).in('status', tab.statuses).order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('Candidatos')}</h1>
      <div className="flex gap-2">
        {TABS.map((x) => (
          <Link key={x.key} href={`/painel/pedidos?aba=${x.key}`} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${x.key === tab.key ? 'bg-brand text-white' : 'bg-field'}`}>
            {t(x.label)}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-muted">
            <tr><th className="p-3 font-semibold">{t('Adotante')}</th><th className="p-3 font-semibold">{t('Animal')}</th><th className="p-3 font-semibold">{t('Bairro')}</th><th className="p-3 font-semibold">{t('Status')}</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="p-3"><strong>{r.profiles?.full_name}</strong><div className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString(locale)}</div></td>
                <td className="p-3">{r.animals?.name}</td>
                <td className="p-3">{r.profiles?.neighborhood ?? '—'}</td>
                <td className="p-3"><span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent-ink">{t(REQUEST_STATUS_LABEL[r.status])}</span></td>
                <td className="p-3 text-right"><Link href={`/painel/pedidos/${r.id}`} className="btn-primary min-h-9 px-3 text-xs">{t('Ver perfil')}</Link></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="p-8 text-center text-muted">{t('Nada por aqui.')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
