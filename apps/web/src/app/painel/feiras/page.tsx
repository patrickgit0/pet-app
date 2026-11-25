import { ConfirmSubmit } from '@/components/confirm';
import { getI18n, pageTitle } from '@/i18n/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyNgo } from '@/lib/ngo';
import { EventCard } from '@/components/event-card';

export const generateMetadata = pageTitle('Feiras de adoção');

/** Data/hora digitada no fuso de Brasília → ISO. */
function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

async function createEvent(ngoId: string, fd: FormData) {
  'use server';
  const date = String(fd.get('date') ?? '');
  const start = String(fd.get('start') ?? '');
  const end = String(fd.get('end') ?? '');
  if (!date || !start || !end || end <= start) redirect('/painel/feiras?erro=horario');
  const supabase = await createClient();
  const { error } = await supabase.from('ngo_events').insert({
    ngo_id: ngoId,
    title: String(fd.get('title') ?? '').trim().slice(0, 120),
    starts_at: toIso(date, start),
    ends_at: toIso(date, end),
    place: String(fd.get('place') ?? '').trim().slice(0, 200),
    neighborhood: String(fd.get('neighborhood') ?? '').trim().slice(0, 80) || null,
    description: String(fd.get('description') ?? '').trim().slice(0, 1000) || null,
  });
  if (error) redirect('/painel/feiras?erro=1');
  revalidatePath('/painel/feiras');
  redirect('/painel/feiras?ok=1');
}

async function deleteEvent(id: string) {
  'use server';
  const supabase = await createClient();
  await supabase.from('ngo_events').delete().eq('id', id);
  revalidatePath('/painel/feiras');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const { erro, ok } = await searchParams;
  const { supabase, ngo } = await getMyNgo();
  const { t } = await getI18n();
  const { data: events } = await supabase.from('ngo_events').select('id, title, starts_at, ends_at, place, neighborhood, city, description')
    .eq('ngo_id', ngo!.id).gte('ends_at', new Date(Date.now() - 30 * 864e5).toISOString()).order('starts_at');
  const now = new Date().toISOString();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t('Feiras de adoção')}</h1>
        <p className="text-sm text-muted">{t('Divulgue suas feiras: elas aparecem na página da ONG e na busca do Vira Lar.')}</p>
      </div>
      {ok && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Feira publicada!')}</p>}
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro === 'horario' ? t('Confira a data e o horário: o fim precisa ser depois do início.') : t('Não foi possível salvar. Confira os campos.')}</p>}

      <form action={createEvent.bind(null, ngo!.id)} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-extrabold sm:col-span-2">{t('Nova feira')}</h2>
        <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="label">{t('Nome da feira')}</span>
          <input name="title" required minLength={3} maxLength={120} placeholder={t('Ex.: Feira de adoção no Parque Raya')} className="field" /></label>
        <label className="flex flex-col gap-1.5"><span className="label">{t('Data')}</span><input type="date" name="date" required min={today} className="field" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5"><span className="label">{t('Início')}</span><input type="time" name="start" required defaultValue="09:00" className="field" /></label>
          <label className="flex flex-col gap-1.5"><span className="label">{t('Fim')}</span><input type="time" name="end" required defaultValue="13:00" className="field" /></label>
        </div>
        <label className="flex flex-col gap-1.5"><span className="label">{t('Local')}</span>
          <input name="place" required minLength={3} maxLength={200} placeholder={t('Ex.: Petshop Amigo, Av. Presidente Vargas, 1000')} className="field" /></label>
        <label className="flex flex-col gap-1.5"><span className="label">{t('Bairro')}</span><input name="neighborhood" maxLength={80} className="field" /></label>
        <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="label">{t('Detalhes (opcional)')}</span>
          <textarea name="description" rows={2} maxLength={1000} placeholder={t('Quantos animais vão, o que levar, se tem estacionamento…')} className="field h-auto py-3" /></label>
        <button className="btn-primary self-start sm:col-span-2">{t('Publicar feira')}</button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('Suas feiras')}</h2>
        {(events ?? []).map((e) => (
          <div key={e.id} className={`flex flex-col gap-2 ${e.ends_at < now ? 'opacity-60' : ''}`}>
            <EventCard e={e} />
            <form action={deleteEvent.bind(null, e.id)} className="self-end">
              <ConfirmSubmit title="Apagar esta feira?" message="Ela some da página da ONG e da busca." confirmLabel="Apagar" tone="danger" className="text-xs font-semibold text-muted underline-offset-2 hover:underline">{t('Apagar')}</ConfirmSubmit>
            </form>
          </div>
        ))}
        {!events?.length && <p className="card p-6 text-center text-sm text-muted">{t('Nenhuma feira cadastrada.')}</p>}
      </section>
    </div>
  );
}
