'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ENERGY_LABEL, SIZE_LABEL, type Database, type AnimalSize, type EnergyLevel } from '@adotai/shared';
import { createClient } from '@/lib/supabase/client';
import { photoUrl } from '@/lib/utils';

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
    await supabase.storage.from('animal-photos').remove([p.storage_path]);
    await supabase.from('animal_photos').delete().eq('id', p.id);
    setCurrent((c) => c.filter((x) => x.id !== p.id));
  }

  const ageM = animal?.birth_date_estimate
    ? (new Date().getFullYear() - new Date(animal.birth_date_estimate).getFullYear()) * 12 + (new Date().getMonth() - new Date(animal.birth_date_estimate).getMonth())
    : 0;

  return (
    <form action={submit} className="card flex max-w-3xl flex-col gap-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Nome"><input name="name" required defaultValue={animal?.name} className="field" /></F>
        <F label="Raça"><input name="breed" defaultValue={animal?.breed ?? 'SRD'} className="field" /></F>
        <F label="Espécie">
          <select name="species" defaultValue={animal?.species ?? 'dog'} className="field"><option value="dog">Cão</option><option value="cat">Gato</option></select>
        </F>
        <F label="Sexo">
          <select name="sex" defaultValue={animal?.sex ?? 'female'} className="field"><option value="female">Fêmea</option><option value="male">Macho</option></select>
        </F>
        <F label="Porte">
          <select name="size" defaultValue={animal?.size ?? 'small'} className="field">
            {(Object.keys(SIZE_LABEL) as AnimalSize[]).map((s) => <option key={s} value={s}>{SIZE_LABEL[s]}</option>)}
          </select>
        </F>
        <F label="Idade aproximada">
          <div className="flex gap-2">
            <input name="age_years" type="number" min={0} max={25} defaultValue={Math.floor(ageM / 12)} className="field" aria-label="Anos" />
            <input name="age_months" type="number" min={0} max={11} defaultValue={ageM % 12} className="field" aria-label="Meses" />
          </div>
        </F>
        <F label="Energia">
          <select name="energy" defaultValue={animal?.energy ?? ''} className="field">
            <option value="">Não sei</option>
            {(Object.keys(ENERGY_LABEL) as EnergyLevel[]).map((e) => <option key={e} value={e}>{ENERGY_LABEL[e]}</option>)}
          </select>
        </F>
        <F label="Cuidados especiais"><input name="special_needs" defaultValue={animal?.special_needs ?? ''} placeholder="Ex.: ração renal" className="field" /></F>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['neutered', 'Castrado'], ['vaccinated', 'Vacinado'], ['dewormed', 'Vermifugado'], ['good_with_kids', 'Ok com crianças'],
          ['good_with_dogs', 'Ok com cães'], ['good_with_cats', 'Ok com gatos'], ['good_for_apartment', 'Bom p/ apartamento'],
        ].map(([n, l]) => (
          <F key={n} label={l}>
            <select name={n} defaultValue={triStr(animal?.[n as keyof Animal] as boolean | null)} className="field h-11">
              {TRI.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </F>
        ))}
      </div>

      <F label="Descrição (personalidade, história, rotina)">
        <textarea name="description" rows={4} defaultValue={animal?.description ?? ''} className="field h-auto py-3" />
      </F>

      <div className="flex flex-col gap-2">
        <span className="label">Fotos</span>
        {current.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {current.map((p) => (
              <div key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(p.storage_path)!} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button type="button" onClick={() => removePhoto(p)} aria-label="Remover foto" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-xs font-bold shadow">✕</button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="text-sm" />
        <span className="text-xs text-muted">A primeira foto vira a capa do anúncio.</span>
      </div>

      <label className="flex items-center gap-2.5 text-sm font-semibold">
        <input type="checkbox" name="publish" defaultChecked={!animal || animal.status === 'available'} className="h-5 w-5 accent-brand" />
        Publicar agora (aparece na busca)
      </label>

      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <button disabled={pending} className="btn-primary h-12 self-start px-6">{pending ? 'Salvando…' : 'Salvar'}</button>
    </form>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="label">{label}</span>{children}</label>;
}
