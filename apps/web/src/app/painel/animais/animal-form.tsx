'use client';

import { useI18n } from '@/i18n/client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ENERGY_LABEL, SIZE_LABEL, type Database, type AnimalSize, type EnergyLevel } from '@adotai/shared';
import { createClient } from '@/lib/supabase/client';
import { photoUrl } from '@/lib/utils';
import { PlusIcon } from '@/components/icons';
import { useConfirm } from '@/components/confirm';

type Animal = Database['public']['Tables']['animals']['Row'];
type Photo = { id: string; storage_path: string; position: number };

const TRI = [
  { v: '', l: 'Não sei' },
  { v: 'true', l: 'Sim' },
  { v: 'false', l: 'Não' },
];
const tri = (v: FormDataEntryValue | null) => (v === 'true' ? true : v === 'false' ? false : null);
const triStr = (v: boolean | null | undefined) => (v === true ? 'true' : v === false ? 'false' : '');

export function AnimalForm({ ngoId, animal, photos = [] }: { ngoId: string; animal?: Animal; photos?: Photo[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [current, setCurrent] = useState<Photo[]>(photos);
  const [confirm, confirmDialog] = useConfirm();
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const addFiles = (list: FileList | null) => {
    const ok = Array.from(list ?? []).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    setFiles((cur) => [...cur, ...ok].slice(0, 10));
  };
  const { t } = useI18n();

  function submit(formData: FormData) {
    setError(null);
    start(async () => {
      const ageYears = Number(formData.get('age_years') || 0);
      const ageMonths = Number(formData.get('age_months') || 0);
      const birth = new Date();
      birth.setMonth(birth.getMonth() - (ageYears * 12 + ageMonths));

      const payload = {
        ngo_id: ngoId,
        name: String(formData.get('name')).trim(),
        species: formData.get('species') as 'dog' | 'cat',
        sex: formData.get('sex') as 'male' | 'female',
        size: formData.get('size') as AnimalSize,
        breed: String(formData.get('breed') || 'SRD'),
        birth_date_estimate: birth.toISOString().slice(0, 10),
        description: String(formData.get('description') || ''),
        energy: (formData.get('energy') || null) as EnergyLevel | null,
        neutered: tri(formData.get('neutered')),
        vaccinated: tri(formData.get('vaccinated')),
        dewormed: tri(formData.get('dewormed')),
        good_with_kids: tri(formData.get('good_with_kids')),
        good_with_dogs: tri(formData.get('good_with_dogs')),
        good_with_cats: tri(formData.get('good_with_cats')),
        good_for_apartment: tri(formData.get('good_for_apartment')),
        special_needs: String(formData.get('special_needs') || '') || null,
        status: (formData.get('publish') === 'on' ? 'available' : 'draft') as 'available' | 'draft',
      };

      const res = animal
        ? await supabase.from('animals').update(payload).eq('id', animal.id).select('id').single()
        : await supabase.from('animals').insert(payload).select('id').single();
      if (res.error || !res.data) return setError('Não foi possível salvar. Confira os campos.');
      const id = res.data.id;

      // Upload das fotos: <ngo_id>/<animal_id>/<arquivo>
      let pos = current.length;
      for (const f of files) {
        const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${ngoId}/${id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from('animal-photos').upload(path, f, { contentType: f.type });
        if (up.error) { setError(`Falha ao enviar ${f.name}.`); continue; }
        await supabase.from('animal_photos').insert({ animal_id: id, storage_path: path, position: pos++ });
      }
      router.push('/painel/animais');
      router.refresh();
    });
  }

  async function removePhoto(p: Photo) {
    if (!(await confirm({ title: 'Remover esta foto?', message: 'A foto é apagada do anúncio na hora. Não dá para desfazer.', confirmLabel: 'Remover foto', tone: 'danger' }))) return;
    await supabase.storage.from('animal-photos').remove([p.storage_path]);
    await supabase.from('animal_photos').delete().eq('id', p.id);
    setCurrent((c) => c.filter((x) => x.id !== p.id));
  }

  const ageM = animal?.birth_date_estimate
    ? (new Date().getFullYear() - new Date(animal.birth_date_estimate).getFullYear()) * 12 + (new Date().getMonth() - new Date(animal.birth_date_estimate).getMonth())
    : 0;

  return (
    <form action={submit} className="card flex max-w-3xl flex-col gap-5 p-4 sm:p-6">
      {confirmDialog}
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Nome"><input name="name" required defaultValue={animal?.name} className="field" /></F>
        <F label="Raça"><input name="breed" defaultValue={animal?.breed ?? 'SRD'} className="field" /></F>
        <F label="Espécie">
          <select name="species" defaultValue={animal?.species ?? 'dog'} className="field"><option value="dog">{t('Cão')}</option><option value="cat">{t('Gato')}</option></select>
        </F>
        <F label="Sexo">
          <select name="sex" defaultValue={animal?.sex ?? 'female'} className="field"><option value="female">{t('Fêmea')}</option><option value="male">{t('Macho')}</option></select>
        </F>
        <F label="Porte">
          <select name="size" defaultValue={animal?.size ?? 'small'} className="field">
            {(Object.keys(SIZE_LABEL) as AnimalSize[]).map((s) => <option key={s} value={s}>{t(SIZE_LABEL[s])}</option>)}
          </select>
        </F>
        <F label="Idade aproximada">
          <div className="grid grid-cols-2 gap-2">
            <span className="flex items-center rounded-xl bg-white ring-[1.5px] ring-line-2 ring-inset focus-within:ring-brand">
              <input name="age_years" type="number" inputMode="numeric" min={0} max={25} defaultValue={Math.floor(ageM / 12)} aria-label={t('Anos')}
                className="h-12 w-full min-w-0 bg-transparent pl-3.5 text-[15px] outline-none" />
              <span className="pr-3.5 text-sm text-muted">{t('anos')}</span>
            </span>
            <span className="flex items-center rounded-xl bg-white ring-[1.5px] ring-line-2 ring-inset focus-within:ring-brand">
              <input name="age_months" type="number" inputMode="numeric" min={0} max={11} defaultValue={ageM % 12} aria-label={t('Meses')}
                className="h-12 w-full min-w-0 bg-transparent pl-3.5 text-[15px] outline-none" />
              <span className="pr-3.5 text-sm text-muted">{t('meses')}</span>
            </span>
          </div>
          <span className="text-xs text-muted">{t('Ex.: 1 ano e 6 meses. Filhote de 3 meses: 0 anos e 3 meses.')}</span>
        </F>
        <F label="Energia">
          <select name="energy" defaultValue={animal?.energy ?? ''} className="field">
            <option value="">{t('Não sei')}</option>
            {(Object.keys(ENERGY_LABEL) as EnergyLevel[]).map((e) => <option key={e} value={e}>{t(ENERGY_LABEL[e])}</option>)}
          </select>
        </F>
        <F label="Cuidados especiais"><input name="special_needs" defaultValue={animal?.special_needs ?? ''} placeholder={t('Ex.: ração renal')} className="field" /></F>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['neutered', 'Castrado'], ['vaccinated', 'Vacinado'], ['dewormed', 'Vermifugado'], ['good_with_kids', 'Ok com crianças'],
          ['good_with_dogs', 'Ok com cães'], ['good_with_cats', 'Ok com gatos'], ['good_for_apartment', 'Bom p/ apartamento'],
        ].map(([n, l]) => (
          <F key={n} label={l}>
            <select name={n} defaultValue={triStr(animal?.[n as keyof Animal] as boolean | null)} className="field h-11">
              {TRI.map((o) => <option key={o.v} value={o.v}>{t(o.l)}</option>)}
            </select>
          </F>
        ))}
      </div>

      <F label="Descrição (personalidade, história, rotina)">
        <textarea name="description" rows={4} defaultValue={animal?.description ?? ''} className="field h-auto py-3" />
      </F>

      <div className="flex flex-col gap-2">
        <span className="label">{t('Fotos')}</span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {current.map((p, i) => (
            <Thumb key={p.id} src={photoUrl(p.storage_path)!} cover={i === 0} onRemove={() => removePhoto(p)} />
          ))}
          {previews.map((src, i) => (
            <Thumb key={src} src={src} cover={current.length === 0 && i === 0} isNew onRemove={() => setFiles((f) => f.filter((_, j) => j !== i))} />
          ))}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-2 bg-ground text-center text-xs font-semibold text-muted hover:border-brand hover:text-brand">
            <PlusIcon size={22} />
            {t('Adicionar fotos')}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
        </div>
        <span className="text-xs text-muted">{t('A primeira foto vira a capa do anúncio. JPG, PNG ou WebP. Fotos claras e de frente adotam mais.')}</span>
      </div>

      <label className="flex items-center gap-2.5 text-sm font-semibold">
        <input type="checkbox" name="publish" defaultChecked={!animal || animal.status === 'available'} className="h-5 w-5 accent-brand" />
        {t('Publicar agora (aparece na busca)')}
      </label>

      {error && <p role="alert" className="text-sm font-semibold text-red-700">{t(error)}</p>}
      <button disabled={pending} className="btn-primary h-12 self-start px-6">{pending ? t('Salvando…') : t('Salvar')}</button>
    </form>
  );
}

/** Campo com rótulo; o rótulo (em português) é traduzido aqui. */
function F({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return <label className="flex flex-col gap-1.5"><span className="label">{t(label)}</span>{children}</label>;
}

function Thumb({ src, cover, isNew, onRemove }: { src: string; cover: boolean; isNew?: boolean; onRemove: () => void }) {
  const { t } = useI18n();
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-field">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {cover && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{t('Capa')}</span>}
      {isNew && <span className="absolute top-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-ink">{t('Nova')}</span>}
      <button type="button" onClick={onRemove} aria-label={t('Remover foto')}
        className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs font-bold shadow hover:bg-white">✕</button>
    </div>
  );
}
