import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { formatRating, REQUEST_STATUS_LABEL } from '@adotai/shared';
import { getMyNgo } from '@/lib/ngo';
import { PlusIcon } from '@/components/icons';

export default async function Overview() {
  const { supabase, ngo } = await getMyNgo();
  const { t, lang, locale } = await getI18n();
  const ngoId = ngo!.id;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [available, newReqs, adoptionsMonth, requests, alerts, allAnimals] = await Promise.all([
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('ngo_id', ngoId).eq('status', 'available'),
    supabase.from('adoption_requests').select('id', { count: 'exact', head: true }).eq('ngo_id', ngoId).eq('status', 'sent'),
    supabase.from('adoptions').select('id', { count: 'exact', head: true }).eq('ngo_id', ngoId).gte('adopted_at', monthStart),
    supabase.from('adoption_requests')
      .select('id, status, created_at, animals(name), profiles!adoption_requests_adopter_id_fkey(full_name)')
      .eq('ngo_id', ngoId).in('status', ['sent', 'reviewing', 'visit_scheduled', 'approved'])
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('checkins')
      .select('id, due_day, status, needs_help, adoptions!inner(ngo_id, animals(name))')
      .eq('adoptions.ngo_id', ngoId).or('status.eq.late,needs_help.eq.true').is('ngo_followed_up_at', null).limit(5),
    supabase.from('animals').select('id, status, animal_photos(id)').eq('ngo_id', ngoId).neq('status', 'archived'),
  ]);

  // Primeiro acesso: o que falta para a ONG estar pronta para receber pedidos
  const animalsList = allAnimals.data ?? [];
  const live = animalsList.filter((a) => a.status === 'available');
  const steps = [
    { done: Boolean(ngo!.description && ngo!.description.length >= 40), label: t('Escreva a apresentação da ONG'), href: '/painel/ong' },
    { done: Boolean(ngo!.opening_hours), label: t('Defina o horário de funcionamento'), href: '/painel/ong' },
    { done: Boolean(ngo!.whatsapp || ngo!.phone), label: t('Informe um telefone ou WhatsApp'), href: '/painel/ong' },
    { done: animalsList.length >= 3, label: t('Cadastre pelo menos 3 animais ({n}/3)', { n: Math.min(3, animalsList.length) }), href: '/painel/animais/novo' },
    { done: live.length > 0 && live.every((a) => a.animal_photos.length >= 3), label: t('Coloque 3 fotos ou mais em cada anúncio'), href: '/painel/animais' },
    { done: Boolean(ngo!.pix_key), label: t('Cadastre a chave Pix para receber doações (opcional)'), href: '/painel/ong' },
  ];
  const doneCount = steps.filter((x) => x.done).length;

  const rating = formatRating(ngo!.rating, lang);
  const kpis = [
    { label: t('Animais disponíveis'), value: available.count ?? 0 },
    { label: t('Pedidos novos'), value: newReqs.count ?? 0 },
    { label: t('Adoções neste mês'), value: adoptionsMonth.count ?? 0 },
    { label: t('Nota da ONG'), value: rating ?? t('Nova'), sub: ngo!.completed_adoptions < 5 ? t('{n}/5 adoções para ter nota', { n: ngo!.completed_adoptions }) : undefined },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('Visão geral')}</h1>
          <p className="text-sm text-muted">{t('{a} pedidos novos e {b} alertas de pós-adoção.', { a: newReqs.count ?? 0, b: alerts.data?.length ?? 0 })}</p>
        </div>
        <Link href="/painel/animais/novo" className="btn-primary"><PlusIcon size={18} /> {t('Cadastrar animal')}</Link>
      </div>

      {doneCount < steps.length && (
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-extrabold">{t('Deixe a ONG pronta para receber pedidos')}</h2>
            <span className="text-sm font-bold text-brand-dark">{doneCount}/{steps.length}</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
          <ul className="flex flex-col gap-1">
            {steps.map((x) => (
              <li key={x.label}>
                <Link href={x.href} className={`flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm hover:bg-ground ${x.done ? 'text-muted line-through' : 'font-semibold'}`}>
                  <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] ${x.done ? 'border-brand bg-brand text-white' : 'border-line-2'}`}>{x.done ? '✓' : ''}</span>
                  <span className="sr-only">{x.done ? t('Feito:') : t('Falta:')}</span>
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="card flex flex-col gap-1 p-4">
            <span className="text-[13px] text-muted">{k.label}</span>
            <span className="text-[28px] font-extrabold">{k.value}</span>
            {k.sub && <span className="text-xs font-semibold text-brand-dark">{k.sub}</span>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="card min-w-0 flex-[999_1_480px] p-5">
          <h2 className="mb-3 text-[17px] font-extrabold">{t('Candidatos recentes')}</h2>
          <ul className="divide-y divide-line">
            {(requests.data ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/painel/pedidos/${r.id}`} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex flex-col">
                    <strong className="text-sm">{r.profiles?.full_name}</strong>
                    <span className="text-xs text-muted">{r.animals?.name} · {new Date(r.created_at).toLocaleDateString(locale)}</span>
                  </span>
                  <span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent-ink">{t(REQUEST_STATUS_LABEL[r.status])}</span>
                </Link>
              </li>
            ))}
            {!requests.data?.length && <li className="py-6 text-center text-sm text-muted">{t('Nenhum pedido em aberto.')}</li>}
          </ul>
        </section>
        <section className="card min-w-0 flex-[1_1_300px] p-5">
          <h2 className="mb-3 text-[17px] font-extrabold">{t('Pós-adoção')}</h2>
          {(alerts.data ?? []).map((c) => (
            <Link key={c.id} href="/painel/pos-adocao" className="mb-2 block rounded-xl bg-accent-soft p-3 text-sm">
              <strong>{c.adoptions?.animals?.name}</strong> · {c.needs_help ? `"${t('Estou com dificuldade')}"` : t('check-in de {n} dias atrasado', { n: c.due_day })}
            </Link>
          ))}
          {!alerts.data?.length && <p className="text-sm text-muted">{t('Nenhum alerta. Tudo em dia.')}</p>}
        </section>
      </div>
    </div>
  );
}
