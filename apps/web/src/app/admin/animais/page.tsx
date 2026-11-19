import { ConfirmSubmit } from '@/components/confirm';
import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { ANIMAL_STATUS_LABEL, SIZE_LABEL, SPECIES_ORDER, SPECIES_PLURAL, animalPath, formatAge, sexLabel, speciesText, type AnimalStatus, type Species } from '@adotai/shared';
import { photoUrl, tintFor } from '@/lib/utils';
import { PawIcon } from '@/components/icons';
import { getSession } from '@/lib/supabase/server';
import { setAnimalStatus } from '../actions';
import { Badge, PageTitle, Pager, SearchBar, daysSince } from '../ui';

type SP = Promise<{ q?: string; status?: string; especie?: string; filtro?: string; page?: string }>;
const SIZE = 30;
const cover = (ph: { storage_path: string; position: number }[]) => [...ph].sort((x, y) => x.position - y.position)[0]?.storage_path ?? null;
const TONE: Record<AnimalStatus, 'good' | 'warn' | 'neutral' | 'bad'> = { available: 'good', reserved: 'warn', adopted: 'neutral', draft: 'neutral', archived: 'bad' };

export default async function AdminAnimals({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const noPhoto = sp.filtro === 'sem-foto';
  const { supabase } = await getSession();
  const { t, lang } = await getI18n();
  let query = supabase
    .from('animals')
    .select('id, name, code, species, breed, sex, size, status, birth_date_estimate, published_at, created_at, ngos(name, slug), animal_photos(storage_path, position)', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (sp.q) query = query.ilike('name', `%${sp.q}%`);
  if (sp.status) query = query.eq('status', sp.status as AnimalStatus);
  if (sp.especie) query = query.eq('species', sp.especie as Species);
  if (noPhoto) query = query.eq('status', 'available');
  query = noPhoto ? query.limit(500) : query.range((page - 1) * SIZE, page * SIZE - 1);
  const { data, count } = await query;
  const animals = noPhoto ? (data ?? []).filter((a) => a.animal_photos.length === 0) : (data ?? []);

  const href = (p: number) => `/admin/animais?${new URLSearchParams({ ...(sp.q && { q: sp.q }), ...(sp.status && { status: sp.status }), ...(sp.especie && { especie: sp.especie }), page: String(p) })}`;

  return (
    <>
      <PageTitle title={t('Animais')} subtitle={noPhoto ? t('Anúncios disponíveis sem foto.') : t('{n} anúncios', { n: count ?? 0 })} />
      <SearchBar q={sp.q} placeholder="Nome do animal">
        <select name="especie" defaultValue={sp.especie ?? ''} className="field h-11 w-auto text-sm" aria-label={t('Espécie')}>
          <option value="">{t('Todas as espécies')}</option>
          {SPECIES_ORDER.map((s) => <option key={s} value={s}>{t(SPECIES_PLURAL[s])}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ''} className="field h-11 w-auto text-sm">
          <option value="">{t('Todos os status')}</option>
          {(Object.keys(ANIMAL_STATUS_LABEL) as AnimalStatus[]).map((s) => <option key={s} value={s}>{t(ANIMAL_STATUS_LABEL[s])}</option>)}
        </select>
      </SearchBar>
      <ul className="card divide-y divide-line">
        {animals.map((a) => {
          const months = a.birth_date_estimate ? Math.round((daysSince(a.birth_date_estimate) ?? 0) / 30.4) : null;
          const waiting = a.status === 'available' ? daysSince(a.published_at ?? a.created_at) : null;
          return (
            <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link href={animalPath(a)} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: tintFor(a.name) }} aria-hidden tabIndex={-1}>
                {cover(a.animal_photos)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={photoUrl(cover(a.animal_photos))!} alt="" className="h-full w-full object-cover" loading="lazy" />
                  : <PawIcon size={22} className="text-ink/30" />}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={animalPath(a)} className="font-bold hover:text-brand">{a.name}</Link>
                  <Badge tone={TONE[a.status]}>{t(ANIMAL_STATUS_LABEL[a.status])}</Badge>
                  {a.animal_photos.length === 0 && <Badge tone="warn">{t('Sem foto')}</Badge>}
                </div>
                <p className="text-xs text-muted">
                  {t(speciesText(a.species, a.breed))} · {t(sexLabel(a.sex))} · {formatAge(months, lang)} · {t('Porte')} {t(SIZE_LABEL[a.size]).toLowerCase()} ·{' '}
                  <Link href={`/ongs/${a.ngos?.slug}`} className="hover:text-brand">{a.ngos?.name}</Link>
                  {waiting != null && ` · ${t('esperando há {n} dias', { n: waiting })}`}
                </p>
              </div>
              </div>
              {a.status !== 'archived' ? (
                <form action={setAnimalStatus.bind(null, a.id, 'archived')}><ConfirmSubmit title="Arquivar este anúncio?" message="Ele sai da busca e deixa de receber pedidos. Dá para reativar depois." confirmLabel="Arquivar" tone="danger" className="btn-ghost min-h-9 px-3 text-xs">{t('Arquivar anúncio')}</ConfirmSubmit></form>
              ) : (
                <form action={setAnimalStatus.bind(null, a.id, 'available')}><ConfirmSubmit title="Reativar este anúncio?" message="Ele volta a aparecer na busca." confirmLabel="Reativar" className="btn-ghost min-h-9 px-3 text-xs">{t('Reativar')}</ConfirmSubmit></form>
              )}
            </li>
          );
        })}
        {!animals.length && <li className="p-6 text-center text-sm text-muted">{t('Nenhum animal encontrado.')}</li>}
      </ul>
      {!noPhoto && <Pager page={page} total={count ?? 0} size={SIZE} href={href} />}
    </>
  );
}
