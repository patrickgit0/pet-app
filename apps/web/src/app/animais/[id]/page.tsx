import { DonatePix } from '@/components/donate-pix';
import { LANDINGS, SITE_URL } from '@/lib/site';
import { ReportButton } from '@/components/report-button';
import { ShareAnimal } from '@/components/share-animal';
import { NgoContact } from '@/components/ngo-contact';
import { ConfirmSubmit } from '@/components/confirm';
import { getI18n } from '@/i18n/server';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ENERGY_LABEL, SIZE_LABEL, animalPath, formatAge, formatRating, sexLabel, speciesText } from '@viralar/shared';
import { compatibility } from '@viralar/shared';
import { getSession } from '@/lib/supabase/server';
import { photoUrl, tintFor, initials } from '@/lib/utils';
import { ChatIcon, HeartIcon, PawIcon, VerifiedIcon } from '@/components/icons';
import { loadAnimal as load } from './load';
import { requestAdoption, startChat, toggleFavorite } from './actions';

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string; perfil?: string }> };

function ageMonths(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const a = await load((await params).id);
  if (!a) return {};
  const { t } = await getI18n();
  return {
    title: t('{name} para adoção', { name: a.name }),
    alternates: { canonical: animalPath(a) },
    description: `${t(speciesText(a.species, a.breed))} · ${t(sexLabel(a.sex))} · ${t('Porte')} ${t(SIZE_LABEL[a.size]).toLowerCase()} · ${a.ngos?.name}. ${a.description ?? ''}`.slice(0, 160),
  };
}

export default async function AnimalPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { erro, perfil } = await searchParams;
  const a = await load(id);
  if (!a || !a.ngos) notFound();
  // Link antigo (uuid) ou nome mudou: manda para o link bonito atual
  const path = animalPath(a);
  if (decodeURIComponent(id) !== path.slice('/animais/'.length)) permanentRedirect(erro ? `${path}?erro=${encodeURIComponent(erro)}` : path);
  const { supabase, user, profile } = await getSession();
  const { t, lang } = await getI18n();

  let isFav = false;
  if (user) {
    const { count } = await supabase.from('favorites').select('animal_id', { count: 'exact', head: true }).eq('animal_id', a.id);
    isFav = (count ?? 0) > 0;
  }
  const isNgoMember = profile?.role === 'ngo_member';
  const match = profile && !isNgoMember ? compatibility(a, profile) : null;
  const photos = [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position);
  const ngo = a.ngos;
  const questions = ((ngo.application_questions ?? []) as unknown[]).filter((q): q is string => typeof q === 'string').slice(0, 5);
  const rating = formatRating(ngo.rating, lang);

  const compat = [
    { ok: a.good_with_kids, label: t('Crianças') },
    { ok: a.good_with_dogs, label: t('Outros cães') },
    { ok: a.good_with_cats, label: t('Gatos') },
    { ok: a.good_for_apartment, label: t('Apartamento') },
  ].filter((c) => c.ok !== null);

  const landing = a.species === 'dog' ? 'cachorro-em-franca' : a.species === 'cat' ? 'gato-em-franca' : 'outros-animais-em-franca';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Vira Lar', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: t(LANDINGS[landing].title), item: `${SITE_URL}/adotar/${landing}` },
      { '@type': 'ListItem', position: 3, name: a.name, item: SITE_URL + path },
    ],
  };

  return (
    <main className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
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
              {[a.species === 'other' ? speciesText(a.species, a.breed) : null, t(sexLabel(a.sex)), formatAge(ageMonths(a.birth_date_estimate), lang),
                `${t('Porte')} ${t(SIZE_LABEL[a.size]).toLowerCase()}`, a.species === 'other' ? null : a.breed === 'SRD' ? t('SRD') : a.breed].filter(Boolean).join(' · ')}
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

        {a.vaccination_card_path && (
          <a href={photoUrl(a.vaccination_card_path)!} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line ring-inset hover:ring-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(a.vaccination_card_path)!} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <span className="flex flex-col">
              <span className="font-bold">{t('Carteirinha de vacinação')}</span>
              <span className="text-xs text-muted">{t('Toque para ver a foto enviada pela ONG')}</span>
            </span>
          </a>
        )}

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

        {match && (
          <div className={`flex flex-col gap-2 rounded-2xl p-4 text-sm ${match.overall === 'good' ? 'bg-brand-soft' : match.overall === 'warn' ? 'bg-accent-soft' : 'bg-red-50'}`}>
            <h2 className="text-[15px] font-extrabold">
              {match.overall === 'good' ? t('Combina com a sua casa') : match.overall === 'warn' ? t('Pode combinar, com alguns cuidados') : t('Pode não combinar com a sua casa')}
            </h2>
            <ul className="flex flex-col gap-1">
              {match.items.map((i) => (
                <li key={i.text} className="flex gap-2">
                  <span aria-hidden className={i.level === 'good' ? 'text-brand' : i.level === 'warn' ? 'text-accent-ink' : 'text-red-700'}>{i.level === 'good' ? '✓' : i.level === 'warn' ? '!' : '✕'}</span>
                  {t(i.text)}
                </li>
              ))}
            </ul>
            <span className="text-xs text-muted">{t('Calculado com o seu perfil de moradia e as informações da ONG. Na dúvida, pergunte na conversa.')}</span>
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

        <NgoContact ngo={ngo} loggedIn={Boolean(user)} animalName={a.name} next={path} />

        {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t(erro)}</p>}

        {!isNgoMember && a.status === 'available' && (
          <div className="flex flex-col gap-3">
            <form action={startChat.bind(null, a.id)}>
              <button className="btn-outline h-12 w-full px-5 text-[15px]"><ChatIcon /> {t('Conversar com a ONG')}</button>
            </form>
            {perfil === 'ok' && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Perfil completo! Agora é só confirmar o pedido abaixo.')}</p>}
            <form id="pedido" action={requestAdoption.bind(null, a.id)} className="flex scroll-mt-4 flex-col gap-3 rounded-2xl border border-line bg-white p-4">
              {questions.length > 0 && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="label mb-1">{t('Perguntas da {ngo} (opcional, ajudam na análise)', { ngo: ngo.name })}</legend>
                  {questions.map((q, i) => (
                    <label key={i} className="flex flex-col gap-1.5 text-sm">
                      <span className="font-semibold">{q}</span>
                      <textarea name={`q${i}`} rows={2} maxLength={800} className="field h-auto py-2.5" />
                    </label>
                  ))}
                </fieldset>
              )}
              <label className="flex items-start gap-2.5 text-sm">
                <input type="checkbox" name="compromisso" required className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
                <span>{t('Entendo que adotar é um compromisso para a vida toda do animal: cuidar da saúde, não abandonar e avisar a ONG se não puder mais ficar com ele.')}{' '}
                  <Link href="/termo-de-adocao" target="_blank" className="font-semibold text-brand">{t('Ver o termo')}</Link></span>
              </label>
              <ConfirmSubmit title="Pedir a adoção?" message="A ONG vai receber seu pedido com seu perfil e seu celular. O endereço completo só é liberado se ela aprovar." confirmLabel="Enviar pedido" className="btn-primary h-13 w-full text-base font-extrabold">{t('Quero adotar')}</ConfirmSubmit>
            </form>
          </div>
        )}
        {a.status === 'available' && <ShareAnimal path={path} name={a.name} />}
        {ngo.pix_key && !isNgoMember && (
          <DonatePix ngo={{ name: ngo.name, city: ngo.city, pix_key: ngo.pix_key }} message={`Vira Lar ${a.name}`}
            title={t('Ajude a cuidar de {name} com um Pix para a ONG', { name: a.name })} />
        )}
        {!user && <p className="text-xs text-muted">{t('Para conversar ou pedir a adoção você precisa de uma conta (só nome, e-mail e senha).')}</p>}
        {!isNgoMember && <ReportButton type="animal" id={a.id} loggedIn={Boolean(user)} label="Denunciar anúncio" className="self-start" />}
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
