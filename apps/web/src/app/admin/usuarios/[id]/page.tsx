import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HOME_LABEL, REQUEST_STATUS_LABEL, formatPhone, type RequestStatus } from '@viralar/shared';
import { getSession } from '@/lib/supabase/server';
import { BackIcon } from '@/components/icons';
import { Badge, fmtDate } from '../../ui';

const ROLE = { adopter: 'Adotante', ngo_member: 'ONG', admin: 'Admin' } as const;
const TONE: Record<RequestStatus, 'good' | 'warn' | 'neutral' | 'bad'> = {
  sent: 'warn', reviewing: 'warn', visit_scheduled: 'good', approved: 'good', rejected: 'neutral', cancelled: 'neutral',
};

type Detail = {
  email: string | null; email_confirmed_at: string | null; last_sign_in_at: string | null;
  phone: string | null; cpf_valid: boolean; lgpd_consent_at: string | null;
  ngo: { name: string; slug: string; role: string } | null;
  favorites: number; conversations: number; reports_against: number;
};

/** Ficha da pessoa para o admin: contato, perfil de moradia, pedidos e adoções. Nunca mostra o CPF. */
export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSession();
  const { t, locale } = await getI18n();
  const [{ data: p }, { data: detail }, { data: requests }, { data: adoptions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.rpc('admin_user_detail', { p_user_id: id }),
    supabase.from('adoption_requests').select('id, status, created_at, rejection_reason, animals(name), ngos(name)')
      .eq('adopter_id', id).order('created_at', { ascending: false }),
    supabase.from('adoptions').select('id, request_id, adopted_at, status, animals(name), ngos(name), checkins(status, due_at, needs_help)')
      .eq('adopter_id', id).order('adopted_at', { ascending: false }),
  ]);
  if (!p) notFound();
  const d = (detail ?? {}) as Detail;
  const yesNo = (v: boolean | null) => (v == null ? '—' : v ? t('Sim') : t('Não'));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/usuarios" aria-label={t('Voltar')} className="btn-ghost h-11 w-11 rounded-full p-0"><BackIcon /></Link>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold sm:text-2xl">
            {p.full_name}
            <Badge tone={p.role === 'admin' ? 'bad' : p.role === 'ngo_member' ? 'good' : 'neutral'}>{t(ROLE[p.role])}</Badge>
          </h1>
          <p className="text-sm text-muted">{t('Desde {a} · último acesso {b}', { a: fmtDate(p.created_at, locale), b: fmtDate(d.last_sign_in_at, locale) })}</p>
        </div>
      </div>

      <section className="card grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 sm:p-5">
        <Info k={t('E-mail')} v={d.email ?? '—'} extra={d.email_confirmed_at ? t('confirmado') : t('não confirmado')} />
        <Info k={t('Celular')} v={d.phone ? formatPhone(d.phone.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')) : '—'} />
        <Info k={t('CPF')} v={d.cpf_valid ? t('CPF válido') : t('Não informado')} />
        <Info k={t('Local')} v={[p.neighborhood, p.city, p.state].filter(Boolean).join(', ') || '—'} />
        <Info k={t('Moradia')} v={p.home_type ? t(HOME_LABEL[p.home_type]) : '—'} />
        <Info k={t('Tem quintal')} v={yesNo(p.has_yard)} />
        <Info k={t('Tem crianças')} v={yesNo(p.has_children)} />
        <Info k={t('Outros animais')} v={p.other_pets || '—'} />
        {p.routine_notes && <div className="sm:col-span-2"><Info k={t('Rotina')} v={p.routine_notes} /></div>}
        <Info k={t('Perfil completo')} v={p.profile_completed_at ? fmtDate(p.profile_completed_at, locale) : t('Não')} />
        <Info k={t('Aceite da privacidade')} v={fmtDate(d.lgpd_consent_at, locale)} />
        {d.ngo && <Info k={t('ONG')} v={d.ngo.name} href={`/ongs/${d.ngo.slug}`} />}
        <Info k={t('Atividade')} v={t('{a} favoritos · {b} conversas', { a: d.favorites ?? 0, b: d.conversations ?? 0 })} />
        {d.reports_against > 0 && <Info k={t('Denúncias contra')} v={String(d.reports_against)} />}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold">{t('Pedidos de adoção ({n})', { n: requests?.length ?? 0 })}</h2>
        <ul className="card divide-y divide-line">
          {(requests ?? []).map((r) => (
            <li key={r.id}>
              <Link href={`/admin/pedidos/${r.id}`} className="flex flex-wrap items-center gap-2 p-4 hover:bg-ground">
                <span className="min-w-0 flex-1">
                  <strong>{r.animals?.name}</strong>
                  <span className="block text-xs text-muted">{r.ngos?.name} · {t('enviado em {d}', { d: fmtDate(r.created_at, locale) })}</span>
                </span>
                <Badge tone={TONE[r.status]}>{t(REQUEST_STATUS_LABEL[r.status])}</Badge>
                <span className="text-xs font-semibold text-brand">{t('Ver histórico →')}</span>
              </Link>
            </li>
          ))}
          {!requests?.length && <li className="p-5 text-center text-sm text-muted">{t('Nenhum pedido.')}</li>}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold">{t('Adoções ({n})', { n: adoptions?.length ?? 0 })}</h2>
        <ul className="card divide-y divide-line">
          {(adoptions ?? []).map((a) => {
            const late = a.checkins.filter((c) => c.status === 'late' || (c.status === 'pending' && new Date(c.due_at) < new Date())).length;
            return (
              <li key={a.id}>
                <Link href={`/admin/pedidos/${a.request_id}`} className="flex flex-wrap items-center gap-2 p-4 hover:bg-ground">
                  <span className="min-w-0 flex-1">
                    <strong>{a.animals?.name}</strong>
                    <span className="block text-xs text-muted">{a.ngos?.name} · {t('adotado em {d}', { d: fmtDate(a.adopted_at, locale) })}</span>
                  </span>
                  {a.status === 'returned' && <Badge tone="bad">{t('Devolvido')}</Badge>}
                  {late > 0 && <Badge tone="bad">{t('Check-in atrasado')}</Badge>}
                  {a.checkins.some((c) => c.needs_help) && <Badge tone="bad">{t('Pediu ajuda')}</Badge>}
                  <span className="text-xs font-semibold text-brand">{t('Ver histórico →')}</span>
                </Link>
              </li>
            );
          })}
          {!adoptions?.length && <li className="p-5 text-center text-sm text-muted">{t('Nenhuma adoção.')}</li>}
        </ul>
      </section>
    </div>
  );
}

function Info({ k, v, extra, href }: { k: string; v: string; extra?: string; href?: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-xs text-muted">{k}</span>
      {href ? <Link href={href} className="font-semibold break-words text-brand">{v}</Link> : <span className="font-semibold break-words">{v}</span>}
      {extra && <span className="text-xs text-muted">{extra}</span>}
    </div>
  );
}
