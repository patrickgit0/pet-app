import QRCode from 'qrcode';
import { getI18n } from '@/i18n/server';
import { pixPayload } from '@/lib/pix';
import { CopyButton } from './copy-button';

/** Doação por Pix direto para a ONG: QR Code + copia e cola + a chave. */
export async function DonatePix({ ngo, message, title }: { ngo: { name: string; city: string; pix_key: string }; message?: string; title?: string }) {
  const { t } = await getI18n();
  const payload = pixPayload({ key: ngo.pix_key, name: ngo.name, city: ngo.city, message });
  const svg = await QRCode.toString(payload, { type: 'svg', margin: 1, width: 168, color: { dark: '#1B1F1D', light: '#FFFFFF' } });
  return (
    <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="mx-auto h-[168px] w-[168px] shrink-0 overflow-hidden rounded-xl bg-white sm:mx-0" role="img" aria-label={t('QR Code do Pix')}
        dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="flex min-w-0 flex-col gap-2 text-sm">
        <h2 className="text-base font-extrabold">{title ?? t('Ajude a {name} com um Pix', { name: ngo.name })}</h2>
        <p className="text-ink-2">{t('O dinheiro vai direto para a ONG, sem taxa e sem passar pelo Vira Lar. Escolha o valor no app do seu banco.')}</p>
        <p className="break-all text-xs text-muted">{t('Chave:')} <strong className="select-all text-ink">{ngo.pix_key}</strong></p>
        <CopyButton text={payload} label="Copiar Pix copia e cola" className="btn-primary self-start" />
      </div>
    </section>
  );
}
