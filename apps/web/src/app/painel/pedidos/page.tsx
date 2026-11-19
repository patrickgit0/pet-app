import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { REQUEST_STATUS_LABEL, type RequestStatus } from '@adotai/shared';
import { getMyNgo } from '@/lib/ngo';

const OPEN: RequestStatus[] = ['sent', 'reviewing', 'visit_scheduled'];
const TABS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  { key: 'esperando', label: 'Esperando resposta', statuses: OPEN },
  { key: 'abertos', label: 'Em aberto', statuses: OPEN },
  { key: 'aprovados', label: 'Aprovados', statuses: ['approved'] },
  { key: 'encerrados', label: 'Encerrados', statuses: ['rejected', 'cancelled'] },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba = 'esperando' } = await searchParams;
  const tab = TABS.find((x) => x.key === aba) ?? TABS[0];
  const { supabase, ngo } = await getMyNgo();
  const { t, locale } = await getI18n();
  const [{ data: rows }, { data: convs }] = await Promise.all([
    supabase.from('adoption_requests')
      .select('id, status, created_at, animal_id, adopter_id, animals(name), profiles!adoption_requests_adopter_id_fkey(full_name, home_type, neighborhood)')
      .eq('ngo_id', ngo!.id).in('status', tab.statuses).order('created_at', { ascending: false }),
    // Última mensagem de cada conversa da ONG: quem falou por último e quando
    supabase.from('conversations').select('id, animal_id, adopter_id, messages(sender_id, created_at)')
      .eq('ngo_id', ngo!.id).order('created_at', { referencedTable: 'messages', ascending: false }).limit(1, { referencedTable: 'messages' }),
  ]);
  const lastByPair = new Map((convs ?? []).map((c) => [`${c.animal_id}:${c.adopter_id}`, { conv: c.id, last: c.messages?.[0] }]));

  /** Esperando a ONG: pedido novo sem resposta, ou a última mensagem da conversa é do adotante. Desde quando. */
  const waitingSince = (r: NonNullable<typeof rows>[number]): string | null => {
    if (!OPEN.includes(r.status)) return null;
    const last = lastByPair.get(`${r.animal_id}:${r.adopter_id}`)?.last;
    if (last && last.sender_id === r.adopter_id) return last.created_at;
    if (r.status === 'sent' && (!last || last.created_at < r.created_at)) return r.created_at;
    return null;
  };
  const all = (rows ?? []).map((r) => ({ ...r, since: waitingSince(r) }));
  const data = tab.key === 'esperando' ? all.filter((r) => r.since).sort((a, b) => a.since!.localeCompare(b.since!)) : all;
  const waitingCount = tab.key === 'esperando' ? data.length : null;
  const ago = (iso: string) => {
    const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));
    return h < 1 ? t('agora há pouco') : h < 24 ? t('há {n} h', { n: h }) : t('há {n} dias', { n: Math.round(h / 24) });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('Candidatos')}</h1>
      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <Link key={x.key} href={`/painel/pedidos?aba=${x.key}`} className={`flex min-h-10 items-center rounded-lg px-3 text-sm font-bold ${x.key === tab.key ? 'bg-brand text-white' : 'bg-field'}`}>
            {t(x.label)}{x.key === 'esperando' && waitingCount != null ? ` (${waitingCount})` : ''}
          </Link>
        ))}
      </div>
      {tab.key === 'esperando' && (
        <p className="text-sm text-muted">{t('Pedidos sem resposta e conversas em que o adotante falou por último, do mais antigo para o mais novo. Responder rápido conta na nota da ONG.')}</p>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-muted">
            <tr><th className="p-3 font-semibold">{t('Adotante')}</th><th className="p-3 font-semibold">{t('Animal')}</th><th className="p-3 font-semibold">{t('Bairro')}</th><th className="p-3 font-semibold">{t('Status')}</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {data.map((r) => {
              const conv = lastByPair.get(`${r.animal_id}:${r.adopter_id}`)?.conv;
              return (
                <tr key={r.id} className="border-t border-line">
                  <td className="p-3">
                    <strong>{r.profiles?.full_name}</strong>
                    <div className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString(locale)}</div>
                    {r.since && <div className="text-xs font-bold text-accent-ink">{t('Esperando {t}', { t: ago(r.since) })}</div>}
                  </td>
                  <td className="p-3">{r.animals?.name}</td>
                  <td className="p-3">{r.profiles?.neighborhood ?? '—'}</td>
                  <td className="p-3"><span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent-ink">{t(REQUEST_STATUS_LABEL[r.status])}</span></td>
                  <td className="p-3 text-right">
                    <span className="inline-flex gap-2">
                      {conv && <Link href={`/mensagens/${conv}`} className="btn-ghost min-h-9 bg-white px-3 text-xs">{t('Responder')}</Link>}
                      <Link href={`/painel/pedidos/${r.id}`} className="btn-primary min-h-9 px-3 text-xs">{t('Ver perfil')}</Link>
                    </span>
                  </td>
                </tr>
              );
            })}
            {!data.length && <tr><td colSpan={5} className="p-8 text-center text-muted">{tab.key === 'esperando' ? t('Ninguém esperando resposta. Tudo em dia!') : t('Nada por aqui.')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
