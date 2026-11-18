'use client';

import { useState } from 'react';
import { WEEK_ORDER, WEEKDAY_LABEL, type OpeningHours, type WeekdayKey } from '@adotai/shared';
import { useI18n } from '@/i18n/client';

const TIMES = Array.from({ length: 33 }, (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`); // 06:00–22:00

/** Editor do horário de funcionamento. Envia o JSON no campo oculto "opening_hours". */
export function HoursEditor({ initial }: { initial: OpeningHours | null }) {
  const { t } = useI18n();
  const [hours, setHours] = useState<OpeningHours>(
    () => initial ?? Object.fromEntries(WEEK_ORDER.map((d) => [d, d === 'sun' ? null : { open: '09:00', close: d === 'sat' ? '13:00' : '17:00' }])),
  );

  const set = (d: WeekdayKey, v: OpeningHours[WeekdayKey]) => setHours((h) => ({ ...h, [d]: v }));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="label mb-1">{t('Horário de funcionamento')}</legend>
      <p className="mb-1 text-xs text-muted">{t('Aparece para os adotantes e define os horários possíveis de visita.')}</p>
      <input type="hidden" name="opening_hours" value={JSON.stringify(hours)} />
      <div className="divide-y divide-line rounded-xl ring-1 ring-line">
        {WEEK_ORDER.map((d) => {
          const v = hours[d];
          return (
            <div key={d} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
              <label className="flex min-w-[118px] items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={Boolean(v)} className="h-5 w-5 accent-brand"
                  onChange={(e) => set(d, e.target.checked ? { open: '09:00', close: '17:00' } : null)} />
                {t(WEEKDAY_LABEL[d])}
              </label>
              {v ? (
                <span className="flex items-center gap-2 text-sm">
                  <select aria-label={t('Abre às')} value={v.open} onChange={(e) => set(d, { ...v, open: e.target.value })} className="field h-10 w-auto text-sm">
                    {TIMES.filter((x) => x < v.close).map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <span className="text-muted">{t('até')}</span>
                  <select aria-label={t('Fecha às')} value={v.close} onChange={(e) => set(d, { ...v, close: e.target.value })} className="field h-10 w-auto text-sm">
                    {TIMES.filter((x) => x > v.open).map((x) => <option key={x}>{x}</option>)}
                  </select>
                </span>
              ) : (
                <span className="text-sm text-muted">{t('Fechado')}</span>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
