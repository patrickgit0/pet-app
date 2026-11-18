import { getI18n } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { formatAge, sexLabel, SIZE_LABEL } from '@adotai/shared';
import { getMyNgo } from '@/lib/ngo';
import { NgoPostKit } from '@/components/share-animal';
import { AnimalForm } from '../animal-form';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      <h1 className="text-2xl font-extrabold">{t('Editar {name}', { name: animal.name })}</h1>
      {animal.status === 'available' && <NgoPostKit animalId={animal.id} name={animal.name} caption={caption} />}
      <AnimalForm ngoId={ngo!.id} animal={animal} photos={photos ?? []} />
    </div>
  );
}
