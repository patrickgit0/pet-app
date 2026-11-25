import Link from 'next/link';
import { WEEK_ORDER, WEEKDAY_LABEL, WEEKDAY_KEYS, openNow, parseOpeningHours, whatsappLink } from '@viralar/shared';
import { getI18n } from '@/i18n/server';
import { WhatsAppGlyph as WhatsAppIcon } from './whatsapp-glyph';

/** "Agora" no fuso de Franca (o servidor da Vercel roda em UTC). */
function nowInBrazil() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

/**
 * Horário de funcionamento + botão de WhatsApp (wa.me com mensagem pronta).
 * WhatsApp só para quem está logado (evita robôs coletando o número); visitante vê "Entre para chamar".
 */
export async function NgoContact({ ngo, loggedIn, animalName, next }: {
  ngo: { name: string; whatsapp: string | null; opening_hours: unknown };
  loggedIn: boolean;
  animalName?: string;
  next: string;
}) {
  const { t } = await getI18n();
  const hours = parseOpeningHours(ngo.opening_hours);
  const now = nowInBrazil();
  const status = openNow(hours, now);
  const todayKey = WEEKDAY_KEYS[now.getDay()];
  if (!hours && !ngo.whatsapp) return null;

  const text = animalName
    ? t('Olá! Vi o(a) {animal} no Vira Lar e gostaria de saber mais.', { animal: animalName })
    : t('Olá! Vi a {ngo} no Vira Lar e gostaria de saber mais sobre adoção.', { ngo: ngo.name });

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-line ring-inset">
      {hours && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status?.open ? 'bg-brand' : 'bg-line-2'}`} aria-hidden />
              <strong>{status?.open ? t('Aberta agora') : t('Fechada agora')}</strong>
              {status?.open && status.until && <span className="text-muted">· {t('fecha às {h}', { h: status.until })}</span>}
            </span>
            <span className="text-xs font-semibold text-brand group-open:hidden">{t('Ver horários')}</span>
          </summary>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {WEEK_ORDER.map((d) => (
              <div key={d} className={`contents ${d === todayKey ? 'font-bold' : ''}`}>
                <dt>{t(WEEKDAY_LABEL[d])}</dt>
                <dd className="text-right text-ink-2">{hours[d] ? `${hours[d]!.open} – ${hours[d]!.close}` : t('Fechado')}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {ngo.whatsapp && (loggedIn ? (
        <a href={whatsappLink(ngo.whatsapp, text)} target="_blank" rel="noopener noreferrer"
          className="btn bg-[#1FA855] text-white hover:bg-[#178a45]">
          <WhatsAppIcon /> {t('Chamar no WhatsApp')}
        </a>
      ) : (
        <Link href={`/entrar?next=${encodeURIComponent(next)}`} className="btn-ghost">
          <WhatsAppIcon /> {t('Entre para chamar no WhatsApp')}
        </Link>
      ))}
    </div>
  );
}
