import { NgoContact } from '@/components/ngo-contact';
import { ConfirmSubmit } from '@/components/confirm';
import { getI18n } from '@/i18n/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ENERGY_LABEL, SIZE_LABEL, SPECIES_LABEL, formatAge, formatRating, sexLabel } from '@adotai/shared';
import { getSession, createClient } from '@/lib/supabase/server';
import { photoUrl, tintFor, initials } from '@/lib/utils';
import { ChatIcon, HeartIcon, PawIcon, VerifiedIcon } from '@/components/icons';
import { requestAdoption, startChat, toggleFavorite } from './actions';

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> };

function ageMonths(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
}

async function load(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('animals')
    .select('*, ngos(id, name, slug, verified_at, rating, completed_adoptions, median_response_minutes, neighborhood, whatsapp, opening_hours), animal_photos(storage_path, position)')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const a = await load((await params).id);
  if (!a) return {};
  const { t } = await getI18n();
  return {
    title: t('{name} para adoção', { name: a.name }),
    description: `${t(SPECIES_LABEL[a.species])} · ${t(sexLabel(a.sex))} · ${t('Porte')} ${t(SIZE_LABEL[a.size]).toLowerCase()} · ${a.ngos?.name}. ${a.description ?? ''}`.slice(0, 160),
  };
}

export default async function AnimalPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { erro } = await searchParams;
  const a = await load(id);
  if (!a || !a.ngos) notFound();
  const { supabase, user, profile } = await getSession();
  const { t, lang } = await getI18n();

  let isFav = false;
  if (user) {
    const { count } = await supabase.from('favorites').select('animal_id', { count: 'exact', head: true }).eq('animal_id', id);
    isFav = (count ?? 0) > 0;
  }
  const isNgoMember = profile?.role === 'ngo_member';
  const photos = [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position);
  const ngo = a.ngos;
  const rating = formatRating(ngo.rating, lang);

  const compat = [
    { ok: a.good_with_kids, label: t('Crianças') },
    { ok: a.good_with_dogs, label: t('Outros cães') },
    { ok: a.good_with_cats, label: t('Gatos') },
    { ok: a.good_for_apartment, label: t('Apartamento') },
  ].filter((c) => c.ok !== null);

  return (
    <main className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-3">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl" style={{ background: tintFor(a.name) }}>
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl(photos[0].storage_path)!} alt={t('Foto de {name}', { name: a.name })} className="h-full w-full object-cover" />
          ) : (
            <PawIcon size={72} className="text-ink/30" />
          )}
        </div>
        {photos.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {photos.slice(1, 6).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.storage_path} src={photoUrl(p.storage_path)!} alt="" className="aspect-square rounded-xl object-cover" />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">{a.name}</h1>
            <p className="text-muted">
              {t(sexLabel(a.sex))} · {formatAge(ageMonths(a.birth_date_estimate), lang)} · {t('Porte')} {t(SIZE_LABEL[a.size]).toLowerCase()} · {a.breed === 'SRD' ? t('SRD') : a.breed}
            </p>
            {a.status === 'reserved' && <span className="mt-2 inline-block rounded-lg bg-accent-soft px-2 py-1 text-xs font-bold text-accent-ink">{t('Reservado — adoção em andamento')}</span>}
          </div>
          {!isNgoMember && (
            <form action={toggleFavorite.bind(null, a.id, isFav)}>
              <button aria-label={isFav ? t('Remover dos favoritos') : t('Favoritar')} className="btn-ghost h-11 w-11 rounded-full p-0">
                <HeartIcon filled={isFav} className={isFav ? 'text-accent' : ''} />
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Fact k={t('Castração')} v={a.neutered == null ? t('Não informado') : a.neutered ? t('Castrado') : t('Não castrado')} />
          <Fact k={t('Vacinas')} v={a.vaccinated == null ? t('Não informado') : a.vaccinated ? t('Em dia') : t('Pendentes')} />
          <Fact k={t('Energia')} v={a.energy ? t(ENERGY_LABEL[a.energy]) : t('Não informado')} />
        </div>

        {compat.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-[15px] font-extrabold">{t('Convivência')}</h2>
            <div className="flex flex-wrap gap-2">
              {compat.map((c) => (
                <span key={c.label} className={`rounded-full px-3 py-1.5 text-[13px] ring-1 ring-line-2 ring-inset ${c.ok ? '' : 'text-muted'}`}>
                  {c.ok ? '✓' : '✕'} {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {a.special_needs && <p className="rounded-xl bg-accent-soft p-3 text-sm text-accent-ink"><strong>{t('Cuidados especiais:')}</strong> {a.special_needs}</p>}
        {a.description && <p className="leading-relaxed text-ink-2">{a.description}</p>}

        <Link href={`/ongs/${ngo.slug}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line ring-inset">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand font-extrabold text-white">{initials(ngo.name)}</span>
          <span className="flex flex-col">
            <span className="flex items-center gap-1 font-bold">
              {ngo.name} {ngo.verified_at && <VerifiedIcon className="text-brand" />}
            </span>
            <span className="text-xs text-muted">
              {rating ? `★ ${rating}` : t('Nova na plataforma')} · {t('{n} adoções', { n: ngo.completed_adoptions })}
              {ngo.median_response_minutes != null && ` · ${t('responde em ~{time}', { time: ngo.median_response_minutes < 60 ? `${ngo.median_response_minutes} min` : `${Math.round(ngo.median_response_minutes / 60)} h` })}`}
            </span>
          </span>
        </Link>

        <NgoContact ngo={ngo} loggedIn={Boolean(user)} animalName={a.name} next={`/animais/${a.id}`} />

        {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t(erro)}</p>}

        {!isNgoMember && a.status === 'available' && (
          <div className="flex gap-3">
            <form action={startChat.bind(null, a.id)}>
              <button className="btn-outline h-13 px-5 text-[15px]"><ChatIcon /> {t('Conversar')}</button>
            </form>
            <form action={requestAdoption.bind(null, a.id)} className="flex-1">
              <ConfirmSubmit title="Pedir a adoção?" message="A ONG vai receber seu pedido com seu perfil e seu celular. O endereço completo só é liberado se ela aprovar." confirmLabel="Enviar pedido" className="btn-primary h-13 w-full text-base font-extrabold">{t('Quero adotar')}</ConfirmSubmit>
            </form>
          </div>
        )}
        {!user && <p className="text-xs text-muted">{t('Para conversar ou pedir a adoção você precisa de uma conta (só nome, e-mail e senha).')}</p>}
      </section>
    </main>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-brand-soft p-2.5">
      <span className="text-[11px] text-brand-dark">{k}</span>
      <span className="text-[13px] font-bold">{v}</span>
    </div>
  );
}
