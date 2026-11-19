import { getI18n } from '@/i18n/server';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConfirmSubmit } from '@/components/confirm';
import { animalPath, formatAge, sexLabel, SIZE_LABEL } from '@adotai/shared';
import { getMyNgo } from '@/lib/ngo';
import { NgoPostKit } from '@/components/share-animal';
import { AnimalForm } from '../animal-form';

/** Cria um rascunho com os mesmos dados (sem fotos, carteirinha nem nome) para cadastrar irmãos de ninhada etc. mais rápido. */
async function duplicate(id: string) {
  'use server';
  const supabase = await createClient();
  const { data: a } = await supabase.from('animals')
    .select('ngo_id, name, species, sex, size, birth_date_estimate, breed, description, energy, neutered, vaccinated, dewormed, special_needs, good_with_kids, good_with_dogs, good_with_cats, good_for_apartment')
    .eq('id', id).maybeSingle();
  if (!a) return;
  const { data: copy } = await supabase.from('animals').insert({ ...a, name: `${a.name} (cópia)`, status: 'draft' }).select('id').single();
  if (copy) redirect(`/painel/animais/${copy.id}?duplicado=1`);
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ duplicado?: string }> }) {
  const { id } = await params;
  const { duplicado } = await searchParams;
  const { supabase, ngo } = await getMyNgo();
  const { t, lang } = await getI18n();
  const { data: animal } = await supabase.from('animals').select('*').eq('id', id).eq('ngo_id', ngo!.id).maybeSingle();
  if (!animal) notFound();
  const { data: photos } = await supabase.from('animal_photos').select('id, storage_path, position').eq('animal_id', id).order('position');

  const months = animal.birth_date_estimate
    ? (new Date().getFullYear() - new Date(animal.birth_date_estimate).getFullYear()) * 12 + (new Date().getMonth() - new Date(animal.birth_date_estimate).getMonth())
    : null;
  const facts = [t(sexLabel(animal.sex)), formatAge(months, lang), `${t('Porte')} ${t(SIZE_LABEL[animal.size]).toLowerCase()}`,
    animal.neutered && t('Castrado'), animal.vaccinated && t('Vacinado')].filter(Boolean).join(' · ');
  // Legenda para o Instagram; {url} é trocado pelo link real do anúncio no navegador.
  const caption = [
    t('{name} está procurando uma família!', { name: animal.name }),
    facts,
    animal.description ? animal.description.replace(/\s*\(Anúncio de exemplo\.\)\s*$/, '') : '',
    t('Quer adotar? Converse com a {ngo} pelo Adotaí: {url}', { ngo: ngo!.name, url: '{url}' }),
    '#adote #adocaoresponsavel #naocompreadote #ribeiraopreto',
  ].filter(Boolean).join('\n\n');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t('Editar {name}', { name: animal.name })}</h1>
        <form action={duplicate.bind(null, animal.id)}>
          <ConfirmSubmit title="Duplicar este animal?" message="Cria um rascunho com os mesmos dados, sem as fotos. Útil para irmãos de ninhada." confirmLabel="Duplicar" className="btn-ghost min-h-10 bg-white px-3 text-sm">{t('Duplicar')}</ConfirmSubmit>
        </form>
      </div>
      {duplicado && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Cópia criada como rascunho. Troque o nome, coloque as fotos e publique.')}</p>}
      {animal.status === 'available' && <NgoPostKit animalId={animal.id} path={animalPath(animal)} name={animal.name} caption={caption} />}
      <AnimalForm ngoId={ngo!.id} animal={animal} photos={photos ?? []} />
    </div>
  );
}
