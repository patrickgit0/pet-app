import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { PawIcon } from '@/components/icons';

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <PawIcon size={40} className="mb-4 text-primary" />
      <h1 className="text-2xl font-bold">{t('Página não encontrada')}</h1>
      <p className="mt-2 text-ink-2">{t('O link pode estar errado ou o anúncio já foi removido (às vezes porque o animal foi adotado).')}</p>
      <Link href="/" className="btn btn-primary mt-6">{t('Ver animais para adoção')}</Link>
    </div>
  );
}
