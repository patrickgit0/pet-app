import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { CalendarIcon } from './icons';

export type EventCardData = {
  id: string; title: string; starts_at: string; ends_at: string; place: string;
  neighborhood: string | null; city: string; description: string | null;
  ngos?: { name: string; slug: string } | null;
};

/** Cartão de feira de adoção: data, horário, local e (opcional) a ONG. */
export async function EventCard({ e }: { e: EventCardData }) {
  const { t, locale } = await getI18n();
  const tz = { timeZone: 'America/Sao_Paulo' } as const;
  const day = new Date(e.starts_at).toLocaleDateString(locale, { ...tz, weekday: 'long', day: '2-digit', month: 'long' });
  const time = (d: string) => new Date(d).toLocaleTimeString(locale, { ...tz, hour: '2-digit', minute: '2-digit' });
  const sameDay = new Date(e.starts_at).toLocaleDateString('pt-BR', tz) === new Date(e.ends_at).toLocaleDateString('pt-BR', tz);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.place, e.neighborhood, e.city].filter(Boolean).join(', '))}`;
  return (
    <article className="card flex gap-3 p-4">
      <CalendarIcon size={22} className="mt-0.5 shrink-0 text-brand" />
      <div className="flex min-w-0 flex-col gap-0.5 text-sm">
        <strong className="text-base">{e.title}</strong>
        <span className="font-semibold first-letter:uppercase">
          {day} · {time(e.starts_at)}–{sameDay ? time(e.ends_at) : new Date(e.ends_at).toLocaleString(locale, { ...tz, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
        <a href={maps} target="_blank" rel="noopener noreferrer" className="text-brand underline-offset-2 hover:underline">
          {[e.place, e.neighborhood, e.city].filter(Boolean).join(' · ')}
        </a>
        {e.ngos && <Link href={`/ongs/${e.ngos.slug}`} className="text-xs font-semibold text-muted hover:text-brand">{t('Organização: {ngo}', { ngo: e.ngos.name })}</Link>}
        {e.description && <p className="mt-1 text-ink-2">{e.description}</p>}
      </div>
    </article>
  );
}
