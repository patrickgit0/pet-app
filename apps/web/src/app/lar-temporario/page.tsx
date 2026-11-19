import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SIZE_LABEL, SPECIES_ORDER, SPECIES_PLURAL, formatPhone, type AnimalSize, type Species } from '@adotai/shared';
import { getI18n, pageTitle } from '@/i18n/server';
import { createClient, getSession } from '@/lib/supabase/server';
import { ConfirmSubmit } from '@/components/confirm';

export const generateMetadata = pageTitle('Seja lar temporário');

function mobile55(v: string): string | null {
  let d = v.replace(/\D/g, '');
  if (d.length === 11) d = `55${d}`;
  return /^55[1-9][0-9]9[0-9]{8}$/.test(d) ? d : null;
}

async function save(fd: FormData) {
  'use server';
  const { supabase, user } = await getSession();
  if (!user) redirect('/entrar?next=/lar-temporario');
  const phone = mobile55(String(fd.get('phone') ?? ''));
  if (!phone) redirect('/lar-temporario?erro=celular');
  const species = fd.getAll('species').map(String).filter((s) => (SPECIES_ORDER as readonly string[]).includes(s)) as Species[];
  const sizes = fd.getAll('sizes').map(String).filter((s) => s in SIZE_LABEL) as AnimalSize[];
  if (!species.length || !sizes.length) redirect('/lar-temporario?erro=escolha');
  const { error } = await supabase.from('foster_offers').upsert({
    user_id: user.id, species, sizes,
    max_weeks: Math.min(52, Math.max(1, Number(fd.get('max_weeks')) || 4)),
    has_other_pets: fd.get('has_other_pets') === 'sim' ? true : fd.get('has_other_pets') === 'nao' ? false : null,
    notes: String(fd.get('notes') ?? '').trim().slice(0, 600) || null,
    contact_phone: phone, active: true,
  });
  if (error) redirect('/lar-temporario?erro=1');
  revalidatePath('/lar-temporario');
  redirect('/lar-temporario?ok=1');
}

async function setActive(active: boolean) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('foster_offers').update({ active }).eq('user_id', user.id);
  revalidatePath('/lar-temporario');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { ok, erro } = await searchParams;
  const { supabase, user } = await getSession();
  const { t } = await getI18n();
  const { data: offer } = user ? await supabase.from('foster_offers').select('*').eq('user_id', user.id).maybeSingle() : { data: null };
  const errMsg = erro === 'celular' ? 'Informe um celular válido com DDD (ex.: (16) 99999-0000).'
    : erro === 'escolha' ? 'Escolha pelo menos uma espécie e um porte.' : erro ? 'Não foi possível salvar. Tente de novo.' : null;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('Seja lar temporário')}</h1>
        <p className="text-ink-2">{t('Lar temporário é quem abriga um animal resgatado por algumas semanas, até ele ser adotado. A ONG continua responsável: ela cuida da ração, do veterinário e da adoção. Você oferece espaço e carinho.')}</p>
        <ul className="mt-1 flex flex-col gap-1 text-sm text-ink-2 [&>li]:before:mr-2 [&>li]:before:text-brand [&>li]:before:content-['✓']">
          <li>{t('Cada lar temporário libera uma vaga no abrigo para outro resgate.')}</li>
          <li>{t('Você escolhe a espécie, o porte e por quanto tempo pode ajudar.')}</li>
          <li>{t('Só ONGs verificadas veem seu nome, bairro e celular, e entram em contato pelo WhatsApp.')}</li>
        </ul>
      </header>

      {ok && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Pronto! As ONGs verificadas já podem ver sua oferta e falar com você.')}</p>}
      {errMsg && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t(errMsg)}</p>}

      {!user ? (
        <div className="card flex flex-col gap-3 p-5">
          <p>{t('Para se oferecer como lar temporário, entre ou crie sua conta (só nome, e-mail e senha).')}</p>
          <div className="flex gap-2">
            <Link href="/entrar?next=/lar-temporario" className="btn-ghost">{t('Entrar')}</Link>
            <Link href="/criar-conta?next=/lar-temporario" className="btn-primary">{t('Criar conta')}</Link>
          </div>
        </div>
      ) : (
        <>
          {offer && (
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm ${offer.active ? 'bg-brand-soft text-brand-dark' : 'bg-ground text-muted'}`}>
              <strong>{offer.active ? t('Sua oferta está visível para as ONGs.') : t('Sua oferta está pausada.')}</strong>
              <form action={setActive.bind(null, !offer.active)}>
                <ConfirmSubmit title={offer.active ? 'Pausar sua oferta?' : 'Reativar sua oferta?'}
                  message={offer.active ? 'As ONGs deixam de ver seu nome e contato até você reativar.' : 'As ONGs verificadas voltam a ver sua oferta.'}
                  confirmLabel={offer.active ? 'Pausar' : 'Reativar'} className="btn-ghost min-h-9 bg-white px-3 text-xs">{offer.active ? t('Pausar') : t('Reativar')}</ConfirmSubmit>
              </form>
            </div>
          )}
          <form action={save} className="card flex flex-col gap-4 p-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="label mb-1">{t('Posso abrigar')}</legend>
              <div className="flex flex-wrap gap-4">
                {SPECIES_ORDER.map((s) => (
                  <label key={s} className="flex min-h-10 items-center gap-2"><input type="checkbox" name="species" value={s} defaultChecked={offer ? offer.species.includes(s) : s !== 'other'} className="h-5 w-5 accent-brand" /> {t(SPECIES_PLURAL[s])}</label>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="label mb-1">{t('Porte')}</legend>
              <div className="flex flex-wrap gap-4">
                {(Object.keys(SIZE_LABEL) as AnimalSize[]).map((s) => (
                  <label key={s} className="flex min-h-10 items-center gap-2"><input type="checkbox" name="sizes" value={s} defaultChecked={offer ? offer.sizes.includes(s) : s !== 'large'} className="h-5 w-5 accent-brand" /> {t(SIZE_LABEL[s])}</label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className="label">{t('Por quanto tempo?')}</span>
                <select name="max_weeks" defaultValue={String(offer?.max_weeks ?? 4)} className="field">
                  {[1, 2, 4, 8, 12, 26].map((w) => <option key={w} value={w}>{w === 1 ? t('Até 1 semana') : t('Até {n} semanas', { n: w })}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5"><span className="label">{t('Tem outros animais em casa?')}</span>
                <select name="has_other_pets" defaultValue={offer?.has_other_pets == null ? '' : offer.has_other_pets ? 'sim' : 'nao'} className="field">
                  <option value="">{t('Prefiro não dizer')}</option><option value="sim">{t('Sim')}</option><option value="nao">{t('Não')}</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1.5"><span className="label">{t('Celular com WhatsApp')}</span>
              <input name="phone" required inputMode="tel" placeholder="(16) 99999-0000" defaultValue={offer?.contact_phone ? formatPhone(offer.contact_phone.slice(2)) : ''} className="field" /></label>
            <label className="flex flex-col gap-1.5"><span className="label">{t('Conte um pouco (opcional)')}</span>
              <textarea name="notes" rows={3} maxLength={600} defaultValue={offer?.notes ?? ''} placeholder={t('Ex.: moro em casa com quintal telado, trabalho em home office, já cuidei de filhotes.')} className="field h-auto py-3" /></label>
            <p className="text-xs text-muted">{t('Ao salvar, você autoriza ONGs verificadas do Adotaí a ver seu nome, bairro e celular para combinar o lar temporário. Você pode pausar ou apagar a oferta quando quiser.')}</p>
            <button className="btn-primary self-start">{offer ? t('Salvar alterações') : t('Quero ser lar temporário')}</button>
          </form>
        </>
      )}
    </main>
  );
}
