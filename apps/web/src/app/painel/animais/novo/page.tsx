import { getI18n } from '@/i18n/server';
import { getMyNgo } from '@/lib/ngo';
import { AnimalForm } from '../animal-form';

export default async function Page() {
  const { ngo } = await getMyNgo();
  const { t } = await getI18n();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('Cadastrar animal')}</h1>
      <AnimalForm ngoId={ngo!.id} />
    </div>
  );
}
