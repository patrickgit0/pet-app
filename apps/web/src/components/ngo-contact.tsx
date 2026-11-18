import Link from 'next/link';
import { WEEK_ORDER, WEEKDAY_LABEL, WEEKDAY_KEYS, openNow, parseOpeningHours, whatsappLink } from '@adotai/shared';
import { getI18n } from '@/i18n/server';

/** "Agora" no fuso de Ribeirão Preto (o servidor da Vercel roda em UTC). */
function nowInBrazil() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
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
    ? t('Olá! Vi o(a) {animal} no Adotaí e gostaria de saber mais.', { animal: animalName })
    : t('Olá! Vi a {ngo} no Adotaí e gostaria de saber mais sobre adoção.', { ngo: ngo.name });

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
