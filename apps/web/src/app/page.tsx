import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  AGE_GROUPS, PILOT_CITY, RADIUS_OPTIONS_KM, SIZE_LABEL, SORT_OPTIONS,
  type AnimalSize, type Species,
} from '@adotai/shared';
import { getSession } from '@/lib/supabase/server';
import { readSearchLocation } from '@/lib/search-location';
import { AnimalCard } from '@/components/animal-card';
import { MapView } from '@/components/map-view';
import { LocateButton } from '@/components/locate-button';
import { SearchIcon } from '@/components/icons';
import { FilterPanel } from '@/components/filter-panel';
import { AutoSubmitSelect } from '@/components/auto-submit-select';

type SP = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const PAGE_SIZE = 24;

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const { t } = await getI18n();

  // Centro da busca: localização escolhida (cookie) > endereço do perfil > cidade piloto
  let center: { lat: number; lng: number; label: string } = { lat: PILOT_CITY.lat, lng: PILOT_CITY.lng, label: `${PILOT_CITY.name}, ${PILOT_CITY.state}` };
  const chosen = await readSearchLocation();
  if (chosen) {
    center = { lat: chosen.lat, lng: chosen.lng, label: chosen.label || t('Sua localização') };
  } else if (profile?.location) {
    const { data: loc } = await supabase.rpc('get_my_location');
    const row = loc?.[0];
    if (row?.lat != null && row?.lng != null) {
      center = { lat: row.lat, lng: row.lng, label: [profile.neighborhood, profile.city].filter(Boolean).join(', ') || t('Seu endereço') };
    }
  }

  const radius = Number(sp.raio ?? 10);
  const species = list(sp.especie) as Species[];
  const sizes = list(sp.porte) as AnimalSize[];
  const ages = list(sp.idade);
  const sort = String(sp.ordem ?? 'recommended');
  const page = Math.max(1, Number(sp.page ?? 1));
  const q = typeof sp.q === 'string' && sp.q.trim() ? sp.q.trim() : null;

  const { data: animals, error } = await supabase.rpc('search_animals', {
    p_lat: center.lat,
    p_lng: center.lng,
    p_radius_km: radius,
    p_species: species.length ? species : undefined,
    p_sizes: sizes.length ? sizes : undefined,
    p_age_groups: ages.length ? ages : undefined,
    p_neutered: sp.castrado === '1' ? true : undefined,
    p_good_with_kids: sp.criancas === '1' ? true : undefined,
    p_good_with_cats: sp.gatos === '1' ? true : undefined,
    p_good_with_dogs: sp.caes === '1' ? true : undefined,
    p_good_for_apartment: sp.apartamento === '1' ? true : undefined,
    p_verified_only: sp.verificadas === '1',
    p_query: q ?? undefined,
    p_sort: sort,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  const total = Number(animals?.[0]?.total_count ?? 0);
  const pins = (animals ?? [])
    .filter((a) => a.approx_lat != null && a.approx_lng != null)
    .map((a) => ({ id: a.id, label: a.name, lat: Number(a.approx_lat), lng: Number(a.approx_lng) }));

  const activeCount = species.length + sizes.length + ages.length +
    ['castrado', 'criancas', 'caes', 'gatos', 'apartamento', 'verificadas'].filter((k) => sp[k] === '1').length + (sp.raio ? 1 : 0);

  const pageHref = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) list(v).forEach((x) => u.append(k, x));
    u.set('page', String(p));
    return `/?${u.toString()}`;
  };

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col items-stretch gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:gap-6">
      <form method="get" className="flex w-full flex-col gap-3 lg:card lg:w-[260px] lg:shrink-0 lg:gap-5 lg:p-5">
        <div className="hidden items-center justify-between lg:flex">
          <h2 className="text-base font-extrabold">{t('Filtros')}</h2>
          <Link href="/" className="text-[13px] font-semibold text-brand">{t('Limpar')}</Link>
        </div>
        <label className="flex items-center gap-2 rounded-xl bg-white px-3.5 ring-[1.5px] ring-line-2 ring-inset lg:bg-field lg:ring-0">
          <SearchIcon size={18} className="text-muted" />
          <input name="q" type="search" enterKeyHint="search" defaultValue={q ?? ''} placeholder={t('Nome, raça ou ONG')} className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none lg:h-11 lg:text-sm" />
        </label>
        <FilterPanel activeCount={activeCount}>
        <div className="card flex flex-col gap-5 p-4 lg:contents">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{t('Buscando perto de')}</span>
          <span className="text-sm font-bold">{center.label}</span>
          <Suspense><LocateButton /></Suspense>
        </div>
        <label className="flex flex-col gap-2">
          <span className="label">{t('Distância')}</span>
          <select name="raio" defaultValue={String(radius)} className="field h-11">
            {RADIUS_OPTIONS_KM.map((r) => <option key={r} value={r}>{t('Até {r} km', { r })}</option>)}
          </select>
        </label>
        <Group title={t('Espécie')} name="especie" values={species} options={[{ value: 'dog', label: t('Cães') }, { value: 'cat', label: t('Gatos') }]} />
        <Group title={t('Porte')} name="porte" values={sizes} options={(Object.keys(SIZE_LABEL) as AnimalSize[]).map((s) => ({ value: s, label: t(SIZE_LABEL[s]) }))} />
        <Group title={t('Idade')} name="idade" values={ages} options={AGE_GROUPS.map((a) => ({ value: a.value, label: t(a.label) }))} />
        <fieldset className="flex flex-col gap-2">
          <legend className="label mb-2">{t('Saúde e convivência')}</legend>
          <Check name="castrado" label={t('Castrado')} checked={sp.castrado === '1'} />
          <Check name="criancas" label={t('Ok com crianças')} checked={sp.criancas === '1'} />
          <Check name="caes" label={t('Ok com cães')} checked={sp.caes === '1'} />
          <Check name="gatos" label={t('Ok com gatos')} checked={sp.gatos === '1'} />
          <Check name="apartamento" label={t('Bom para apartamento')} checked={sp.apartamento === '1'} />
        </fieldset>
        <div className="border-t border-line pt-3">
          <Check name="verificadas" label={t('Só ONGs verificadas')} checked={sp.verificadas === '1'} />
        </div>
        <div className="flex gap-2">
          <Link href="/" className="btn-ghost flex-1 lg:hidden">{t('Limpar')}</Link>
          <button className="btn-primary flex-[2]">{t('Aplicar filtros')}</button>
        </div>
        </div>
        </FilterPanel>
      </form>

      <main className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-extrabold sm:text-[22px]">
            {total === 1 ? t('1 animal para adoção perto de você') : t('{n} animais para adoção perto de você', { n: total })}
          </h1>
          <form method="get" className="flex items-center gap-2">
            {Object.entries(sp).filter(([k]) => k !== 'ordem' && k !== 'page').flatMap(([k, v]) => list(v).map((x, i) => (
              <input key={`${k}${i}`} type="hidden" name={k} value={x} />
            )))}
            <label htmlFor="ordem" className="text-[13px] text-muted">{t('Ordenar por')}</label>
            <AutoSubmitSelect id="ordem" name="ordem" defaultValue={sort} className="field h-10 w-auto text-sm font-semibold">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
            </AutoSubmitSelect>
            <noscript><button className="btn-ghost min-h-10">Ok</button></noscript>
          </form>
        </div>

        {error && <p className="card p-4 text-sm text-red-700">{t('Não foi possível carregar os animais agora.')}</p>}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-5">
          <div id="resultados" className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">
            {(animals ?? []).map((a) => <AnimalCard key={a.id} a={{ ...a, distance_km: Number(a.distance_km) }} />)}
            {!error && total === 0 && (
              <div className="card col-span-full p-8 text-center text-muted">
                {t('Nenhum animal com esses filtros. Tente aumentar a distância ou limpar os filtros.')}
              </div>
            )}
          </div>
          <div className="order-first xl:sticky xl:top-4 xl:order-none xl:w-[340px] xl:shrink-0">
            <MapView center={center} radiusKm={radius} pins={pins} />
          </div>
        </div>

        {total > PAGE_SIZE && (
          <nav className="flex justify-center gap-2" aria-label={t('Paginação')}>
            {page > 1 && <Link className="btn-ghost" href={pageHref(page - 1)}>{t('Anterior')}</Link>}
            <span className="btn">{t('Página {p} de {n}', { p: page, n: Math.ceil(total / PAGE_SIZE) })}</span>
            {page * PAGE_SIZE < total && <Link className="btn-ghost" href={pageHref(page + 1)}>{t('Próxima')}</Link>}
          </nav>
        )}
      </main>
    </div>
  );
}

function Group({ title, name, values, options }: { title: string; name: string; values: string[]; options: { value: string; label: string }[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="label mb-2">{title}</legend>
      {options.map((o) => (
        <label key={o.value} className="flex min-h-7 cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" name={name} value={o.value} defaultChecked={values.includes(o.value)} className="h-[18px] w-[18px] accent-brand" />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

function Check({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex min-h-7 cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="h-[18px] w-[18px] accent-brand" />
      {label}
    </label>
  );
}
