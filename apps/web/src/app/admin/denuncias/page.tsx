import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { resolveReport } from '../actions';
import { Badge, PageTitle, fmtDate } from '../ui';

const TARGET: Record<string, string> = { animal: 'Anúncio', ngo: 'ONG', message: 'Mensagem', review: 'Avaliação', user: 'Usuário' };

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const all = ver === 'todas';
  const { supabase } = await getSession();
  const { t, locale } = await getI18n();
  let query = supabase.from('reports').select('id, target_type, target_id, reason, created_at, resolved_at, profiles(full_name)').order('created_at', { ascending: false }).limit(200);
  if (!all) query = query.is('resolved_at', null);
  const { data: reports } = await query;

  return (
    <>
      <PageTitle title={t('Denúncias')} subtitle={all ? t('Todas as denúncias') : t('Denúncias abertas')}>
        <Link href={all ? '/admin/denuncias' : '/admin/denuncias?ver=todas'} className="text-sm font-semibold text-brand">{all ? t('Só abertas') : t('Ver todas')}</Link>
      </PageTitle>
      <ul className="card divide-y divide-line">
        {(reports ?? []).map((r) => (
          <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warn">{t(TARGET[r.target_type] ?? r.target_type)}</Badge>
                {r.target_type === 'animal' && <Link href={`/animais/${r.target_id}`} className="text-sm font-semibold text-brand">{t('Abrir anúncio')}</Link>}
                {r.resolved_at && <Badge tone="good">{t('Resolvida')}</Badge>}
              </div>
              <p className="mt-1 text-sm">{r.reason}</p>
              <p className="text-xs text-muted">{t('Por {name} em {d}', { name: r.profiles?.full_name ?? '—', d: fmtDate(r.created_at, locale) })}</p>
            </div>
            {!r.resolved_at && (
              <form action={resolveReport.bind(null, r.id)}><button className="btn-ghost min-h-9 px-3 text-xs">{t('Marcar como resolvida')}</button></form>
            )}
          </li>
        ))}
        {!reports?.length && <li className="p-6 text-center text-sm text-muted">{all ? t('Nenhuma denúncia.') : t('Nenhuma denúncia aberta.')}</li>}
      </ul>
    </>
  );
}
