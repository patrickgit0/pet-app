import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { formatRating } from '@viralar/shared';
import { Badge, PageTitle } from './ui';

type Dash = {
  users: { total: number; adopters: number; ngo_members: number; complete: number; new_7d: number; new_30d: number };
  active_7d: number;
  ngos: { total: number; verified: number; pending: number };
  animals: { available: number; reserved: number; adopted: number; draft: number; archived: number; dogs: number; cats: number; no_photo: number; median_days_waiting: number | null };
  requests: { open: number; waiting_48h: number; approved: number; rejected: number; cancelled: number; last_30d: number };
  adoptions: { total: number; last_30d: number; returned: number };
  checkins: { late: number; needs_help: number; answered_rate: number | null };
  messages_7d: number;
  reports_open: number;
  funnel: { signed_up: number; completed: number; requested: number; adopted: number };
  weekly: { week: string; signups: number; requests: number; adoptions: number }[];
  ngo_health: { id: string; name: string; slug: string; verified: boolean; rating: number | null; adoptions: number; response_min: number | null; available: number; open_requests: number; stale_requests: number; late_checkins: number }[];
};

export default async function AdminHome() {
  const { supabase } = await getSession();
  const { t, lang } = await getI18n();
  const { data, error } = await supabase.rpc('admin_dashboard');
  if (error || !data) return <p className="card p-4 text-sm text-red-700">{t('Não foi possível carregar os indicadores.')}</p>;
  const d = data as unknown as Dash;

  // "Precisa de atenção": só o que exige ação de alguém
  const alerts = [
    d.ngos.pending > 0 && { n: d.ngos.pending, text: d.ngos.pending === 1 ? t('ONG aguardando verificação') : t('ONGs aguardando verificação'), href: '/admin/ongs?status=pendente', tone: 'warn' as const },
    d.requests.waiting_48h > 0 && { n: d.requests.waiting_48h, text: t('pedidos sem resposta há mais de 48 h'), href: '/admin/pedidos?status=parado', tone: 'bad' as const },
    d.checkins.needs_help > 0 && { n: d.checkins.needs_help, text: t('adotantes pediram ajuda e a ONG ainda não respondeu'), href: '/admin/adocoes?filtro=ajuda', tone: 'bad' as const },
    d.checkins.late > 0 && { n: d.checkins.late, text: t('check-ins de pós-adoção atrasados'), href: '/admin/adocoes?filtro=atrasado', tone: 'warn' as const },
    d.reports_open > 0 && { n: d.reports_open, text: t('denúncias abertas'), href: '/admin/denuncias', tone: 'bad' as const },
    d.animals.no_photo > 0 && { n: d.animals.no_photo, text: t('anúncios sem foto (adotam bem menos)'), href: '/admin/animais?filtro=sem-foto', tone: 'warn' as const },
  ].filter(Boolean) as { n: number; text: string; href: string; tone: 'warn' | 'bad' }[];

  const kpis = [
    { label: t('Adoções (30 dias)'), value: d.adoptions.last_30d, sub: t('{n} no total', { n: d.adoptions.total }) },
    { label: t('Animais disponíveis'), value: d.animals.available, sub: t('{a} cães · {b} gatos', { a: d.animals.dogs, b: d.animals.cats }) },
    { label: t('Pedidos em aberto'), value: d.requests.open, sub: t('{n} nos últimos 30 dias', { n: d.requests.last_30d }) },
    { label: t('Usuários'), value: d.users.total, sub: t('+{a} na semana · {b} ativos', { a: d.users.new_7d, b: d.active_7d }) },
    { label: t('ONGs'), value: d.ngos.total, sub: t('{n} verificadas', { n: d.ngos.verified }) },
    {
      label: t('Espera mediana'),
      value: d.animals.median_days_waiting == null ? '—' : t('{n} d', { n: Math.round(d.animals.median_days_waiting) }),
      sub: t('tempo que os disponíveis estão esperando'),
    },
  ];

  const f = d.funnel;
  const funnel = [
    { label: t('Criaram conta'), n: f.signed_up },
    { label: t('Completaram o perfil'), n: f.completed },
    { label: t('Pediram adoção'), n: f.requested },
    { label: t('Adotaram'), n: f.adopted },
  ];
  const top = Math.max(1, f.signed_up);
  const weekMax = Math.max(1, ...d.weekly.map((w) => Math.max(w.signups, w.requests)));
  const returnRate = d.adoptions.total ? Math.round((100 * d.adoptions.returned) / d.adoptions.total) : null;

  return (
    <>
      <PageTitle title={t('Visão geral')} subtitle={t('Como a plataforma está indo e o que precisa da sua atenção.')} />

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="card flex flex-col gap-1 p-4">
            <span className="text-xs font-semibold text-muted">{k.label}</span>
            <span className="text-2xl font-extrabold tabular-nums">{k.value}</span>
            <span className="text-xs text-muted">{k.sub}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-2 [&>*]:min-w-0">
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 font-extrabold">{t('Precisa de atenção')}</h2>
          {alerts.length ? (
            <ul className="flex flex-col">
              {alerts.map((a) => (
                <li key={a.href} className="border-t border-line first:border-0">
                  <Link href={a.href} className="flex min-h-12 items-center gap-3 py-2 text-sm hover:text-brand">
                    <Badge tone={a.tone}>{a.n}</Badge>
                    <span className="flex-1">{a.text}</span>
                    <span aria-hidden className="text-muted">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t('Tudo em dia. Nenhuma pendência agora.')}</p>
          )}
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="font-extrabold">{t('Funil de adoção')}</h2>
          <p className="mb-4 text-xs text-muted">{t('Adotantes em cada etapa (onde as pessoas desistem).')}</p>
          <ol className="flex flex-col gap-3">
            {funnel.map((s, i) => {
              const prev = i ? funnel[i - 1].n : null;
              const conv = prev ? Math.round((100 * s.n) / prev) : null;
              return (
                <li key={s.label} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="font-bold tabular-nums">
                      {s.n}
                      {conv != null && <span className="ml-2 text-xs font-semibold text-muted">{t('{n}% da etapa anterior', { n: conv })}</span>}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-field">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, (100 * s.n) / top)}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card p-4 sm:p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-extrabold">{t('Últimas 12 semanas')}</h2>
              <p className="text-xs text-muted">{t('Cadastros, pedidos e adoções por semana.')}</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-line-2" />{t('Cadastros')}</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand" />{t('Pedidos')}</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-accent" />{t('Adoções')}</span>
            </div>
          </div>
          <div className="flex h-40 items-end gap-1.5 sm:gap-3">
            {d.weekly.map((w) => (
              <div key={w.week} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
                title={t('Semana de {w}: {a} cadastros, {b} pedidos, {c} adoções', { w: w.week.split('-').reverse().slice(0, 2).join('/'), a: w.signups, b: w.requests, c: w.adoptions })}>
                <div className="flex flex-1 items-end gap-px">
                  <div className="flex-1 rounded-t bg-line-2" style={{ height: `${(100 * w.signups) / weekMax}%` }} />
                  <div className="flex-1 rounded-t bg-brand" style={{ height: `${(100 * w.requests) / weekMax}%` }} />
                  <div className="flex-1 rounded-t bg-accent" style={{ height: `${(100 * w.adoptions) / weekMax}%` }} />
                </div>
                <span className="truncate text-center text-[10px] text-muted">{w.week.split('-').reverse().slice(0, 2).join('/')}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 font-extrabold">{t('Qualidade')}</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Stat label={t('Check-ins respondidos')} value={d.checkins.answered_rate == null ? '—' : `${d.checkins.answered_rate}%`} />
            <Stat label={t('Taxa de devolução')} value={returnRate == null ? '—' : `${returnRate}%`} />
            <Stat label={t('Pedidos aprovados')} value={d.requests.approved} />
            <Stat label={t('Pedidos recusados')} value={d.requests.rejected} />
            <Stat label={t('Mensagens (7 dias)')} value={d.messages_7d} />
            <Stat label={t('Perfis completos')} value={t('{a} de {b}', { a: d.users.complete, b: d.users.adopters })} />
          </dl>
        </section>

        <section className="card overflow-hidden xl:col-span-1">
          <h2 className="p-4 pb-2 font-extrabold sm:px-5">{t('Saúde das ONGs')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr><th className="px-4 py-2 sm:px-5">{t('ONG')}</th><th className="p-2">{t('Nota')}</th><th className="p-2">{t('Disponíveis')}</th><th className="p-2">{t('Pedidos')}</th><th className="p-2">{t('Resposta')}</th></tr>
              </thead>
              <tbody>
                {d.ngo_health.map((n) => (
                  <tr key={n.id} className="border-t border-line">
                    <td className="px-4 py-2.5 sm:px-5">
                      <Link href={`/ongs/${n.slug}`} className="font-semibold hover:text-brand">{n.name}</Link>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!n.verified && <Badge tone="warn">{t('Não verificada')}</Badge>}
                        {n.stale_requests > 0 && <Badge tone="bad">{t('{n} parados', { n: n.stale_requests })}</Badge>}
                        {n.late_checkins > 0 && <Badge tone="warn">{t('{n} check-ins atrasados', { n: n.late_checkins })}</Badge>}
                      </div>
                    </td>
                    <td className="p-2 tabular-nums">{n.adoptions < 5 ? <span className="text-xs text-muted">{t('Nova')}</span> : `★ ${formatRating(n.rating, lang)}`}</td>
                    <td className="p-2 tabular-nums">{n.available}</td>
                    <td className="p-2 tabular-nums">{n.open_requests}</td>
                    <td className="p-2 tabular-nums">{n.response_min == null ? '—' : n.response_min < 60 ? `${n.response_min} min` : `${Math.round(n.response_min / 60)} h`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}
