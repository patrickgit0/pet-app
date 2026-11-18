import { getI18n } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { getMyNgo } from '@/lib/ngo';
import { AnimalForm } from '../animal-form';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, ngo } = await getMyNgo();
  const { t } = await getI18n();
  const { data: animal } = await supabase.from('animals').select('*').eq('id', id).eq('ngo_id', ngo!.id).maybeSingle();
  if (!animal) notFound();
  const { data: photos } = await supabase.from('animal_photos').select('id, storage_path, position').eq('animal_id', id).order('position');
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('Editar {name}', { name: animal.name })}</h1>
      <AnimalForm ngoId={ngo!.id} animal={animal} photos={photos ?? []} />
    </div>
  );
}
