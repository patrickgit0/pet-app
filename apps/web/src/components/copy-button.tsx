'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/client';

export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={className} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2500); } catch { window.prompt(t('Copie o código:'), text); }
    }}>
      {done ? t('Copiado!') : t(label)}
    </button>
  );
}
