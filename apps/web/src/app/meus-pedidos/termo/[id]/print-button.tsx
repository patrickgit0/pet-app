'use client';

import { useI18n } from '@/i18n/client';

export function PrintButton() {
  const { t } = useI18n();
  return <button type="button" onClick={() => window.print()} className="btn-primary min-h-10 shrink-0 whitespace-nowrap px-4 text-sm">{t('Baixar PDF')}</button>;
}
