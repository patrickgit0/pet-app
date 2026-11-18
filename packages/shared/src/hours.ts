/** Horário de funcionamento da ONG. Chaves na ordem de Date.getDay() (0 = domingo). */
export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];
export type DayHours = { open: string; close: string } | null;
export type OpeningHours = Partial<Record<WeekdayKey, DayHours>>;

/** Nomes em pt-BR (a interface traduz). Segunda primeiro, como se costuma exibir. */
export const WEEKDAY_LABEL: Record<WeekdayKey, string> = {
  mon: 'Segunda', tue: 'Terça', wed: 'Quarta', thu: 'Quinta', fri: 'Sexta', sat: 'Sábado', sun: 'Domingo',
};
export const WEEK_ORDER: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function parseOpeningHours(v: unknown): OpeningHours | null {
  if (!v || typeof v !== 'object') return null;
  const out: OpeningHours = {};
  for (const k of WEEKDAY_KEYS) {
    const d = (v as Record<string, unknown>)[k] as { open?: unknown; close?: unknown } | null | undefined;
    out[k] = d && typeof d.open === 'string' && typeof d.close === 'string' && /^\d{2}:\d{2}$/.test(d.open) && /^\d{2}:\d{2}$/.test(d.close) && toMin(d.open) < toMin(d.close)
      ? { open: d.open, close: d.close } : null;
  }
  return Object.values(out).some(Boolean) ? out : null;
}

export function hoursOn(oh: OpeningHours | null, date: Date): DayHours {
  return oh?.[WEEKDAY_KEYS[date.getDay()]] ?? null;
}

/** Aberta agora? Sem horário cadastrado = desconhecido (null). */
export function openNow(oh: OpeningHours | null, now = new Date()): { open: boolean; until?: string } | null {
  if (!oh) return null;
  const d = hoursOn(oh, now);
  const m = now.getHours() * 60 + now.getMinutes();
  if (d && m >= toMin(d.open) && m < toMin(d.close)) return { open: true, until: d.close };
  return { open: false };
}

/** Horários de 30 em 30 min dentro do expediente do dia (para propor visita). Sem horário cadastrado: 08:00–19:30. */
export function visitSlots(oh: OpeningHours | null, date: Date): string[] {
  const d = oh ? hoursOn(oh, date) : { open: '08:00', close: '20:00' };
  if (!d) return [];
  const out: string[] = [];
  for (let m = Math.ceil(toMin(d.open) / 30) * 30; m + 30 <= toMin(d.close); m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
}

/** Link wa.me com mensagem pronta. whatsapp = só dígitos com 55 (ex.: 5516999990000). */
export function whatsappLink(whatsapp: string, text: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
