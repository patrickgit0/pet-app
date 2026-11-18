import { ConfirmSubmit } from '@/components/confirm';
import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { formatCnpj, formatRating } from '@adotai/shared';
import { getSession } from '@/lib/supabase/server';
import { verifyNgo } from '../actions';
import { Badge, PageTitle, SearchBar, fmtDate } from '../ui';

type SP = Promise<{ q?: string; status?: string }>;

export default async function AdminNgos({ searchParams }: { searchParams: SP }) {
  const { q, status } = await searchParams;
  const { supabase } = await getSession();
  const { t, lang, locale } = await getI18n();
  let query = supabase
    .from('ngos')
    .select('id, name, slug, cnpj, city, neighborhood, email, phone, verified_at, created_at, rating, completed_adoptions, median_response_minutes, animals(status), ngo_members(role, profiles(full_name))')
    .order('verified_at', { nullsFirst: true })
    .order('created_at', { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,cnpj.ilike.%${q.replace(/\D/g, '') || q}%`);
  if (status === 'pendente') query = query.is('verified_at', null);
  if (status === 'verificada') query = query.not('verified_at', 'is', null);
  const { data: ngos } = await query;

  return (
    <>
      <PageTitle title={t('ONGs')} subtitle={t('Confira o CNPJ antes de verificar. O selo aparece para os adotantes.')} />
      <SearchBar q={q} placeholder="Nome, e-mail ou CNPJ">
        <select name="status" defaultValue={status ?? ''} className="field h-11 w-auto text-sm">
          <option value="">{t('Todas')}</option><option value="pendente">{t('Pendentes')}</option><option value="verificada">{t('Verificadas')}</option>
        </select>
      </SearchBar>
      <ul className="flex flex-col gap-3">
        {(ngos ?? []).map((n) => {
          const available = n.animals.filter((a) => a.status === 'available').length;
          const owner = n.ngo_members.find((m) => m.role === 'owner')?.profiles?.full_name;
          return (
            <li key={n.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/ongs/${n.slug}`} className="font-extrabold hover:text-brand">{n.name}</Link>
                  {n.verified_at ? <Badge tone="good">{t('Verificada')}</Badge> : <Badge tone="warn">{t('Pendente')}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">
                  CNPJ{' '}
                  <a className="font-mono text-brand underline" href={`https://brasilapi.com.br/api/cnpj/v1/${n.cnpj}`} target="_blank" rel="noreferrer">{formatCnpj(n.cnpj)}</a>
                  {' · '}{[n.neighborhood, n.city].filter(Boolean).join(', ')}{' · '}{t('desde {d}', { d: fmtDate(n.created_at, locale) })}
                </p>
                <p className="text-xs text-muted">{[owner && t('Responsável: {name}', { name: owner }), n.email, n.phone].filter(Boolean).join(' · ')}</p>
              </div>
              <dl className="grid grid-cols-3 gap-4 text-center text-xs sm:w-64">
                <div><dt className="text-muted">{t('Disponíveis')}</dt><dd className="text-base font-extrabold">{available}</dd></div>
                <div><dt className="text-muted">{t('Adoções')}</dt><dd className="text-base font-extrabold">{n.completed_adoptions}</dd></div>
                <div><dt className="text-muted">{t('Nota')}</dt><dd className="text-base font-extrabold">{n.completed_adoptions < 5 ? t('Nova') : formatRating(n.rating, lang)}</dd></div>
              </dl>
              <form action={verifyNgo.bind(null, n.id, !n.verified_at)}>
                <ConfirmSubmit
                  title={n.verified_at ? 'Remover o selo desta ONG?' : 'Verificar esta ONG?'}
                  message={n.verified_at ? 'Os adotantes deixam de ver o selo de ONG verificada.' : 'Confira o CNPJ antes. Os adotantes passam a ver o selo de ONG verificada.'}
                  confirmLabel={n.verified_at ? 'Remover selo' : 'Verificar ONG'}
                  tone={n.verified_at ? 'danger' : 'default'}
                  className={n.verified_at ? 'btn-ghost w-full min-h-10 px-3 text-xs sm:w-auto' : 'btn-primary w-full min-h-10 px-3 text-xs sm:w-auto'}>
                  {n.verified_at ? t('Remover selo') : t('Verificar ONG')}
                </ConfirmSubmit>
              </form>
            </li>
          );
        })}
        {!ngos?.length && <li className="card p-6 text-center text-sm text-muted">{t('Nenhuma ONG encontrada.')}</li>}
      </ul>
    </>
  );
}
