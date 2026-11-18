'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/client';
import { WhatsAppGlyph } from './whatsapp-glyph';

const pageUrl = (id: string) => `${window.location.origin}/animais/${id}`;

/** Compartilhar o animal: WhatsApp, menu do celular (com a imagem pronta quando possível) e copiar link. */
export function ShareAnimal({ animalId, name }: { animalId: string; name: string }) {
  const { t } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const text = () => t('Conheça {name}, para adoção no Adotaí:', { name });

  async function nativeShare() {
    const url = pageUrl(animalId);
    try {
      const blob = await (await fetch(`/api/card/${animalId}?formato=feed`)).blob();
      const file = new File([blob], `adotai-${animalId}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text: `${text()} ${url}` });
      if (navigator.share) return await navigator.share({ title: name, text: text(), url });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    copy();
  }

  async function copy() {
    await navigator.clipboard.writeText(pageUrl(animalId));
    setMsg(t('Link copiado.'));
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">{t('Conhece alguém que adotaria? Compartilhe:')}</span>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${text()} ${pageUrl(animalId)}`)}`, '_blank', 'noopener')}
          className="btn min-h-10 bg-[#1FA855] px-3 text-sm text-white hover:bg-[#178a45]">
          <WhatsAppGlyph /> WhatsApp
        </button>
        <button type="button" onClick={nativeShare} className="btn-ghost min-h-10 bg-white px-3 text-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
          {t('Compartilhar')}
        </button>
        <button type="button" onClick={copy} className="btn-ghost min-h-10 bg-white px-3 text-sm">{t('Copiar link')}</button>
      </div>
      {msg && <span role="status" className="text-xs font-semibold text-brand-dark">{msg}</span>}
    </div>
  );
}

/** Painel de divulgação para a ONG: prévia do post, baixar feed/stories e legenda pronta. */
export function NgoPostKit({ animalId, name, caption }: { animalId: string; name: string; caption: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const full = () => caption.replace('{url}', pageUrl(animalId));

  return (
    <section className="card flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-extrabold">{t('Divulgar {name}', { name })}</h2>
        <p className="text-sm text-muted">{t('Imagens prontas para o Instagram e o WhatsApp, com o link do anúncio.')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/card/${animalId}?formato=feed`} alt={t('Prévia do post de {name}', { name })} className="w-full rounded-xl border border-line bg-field" loading="lazy" />
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <a href={`/api/card/${animalId}?formato=feed&baixar=1`} className="btn-primary min-h-10 px-3 text-sm">{t('Baixar post (feed)')}</a>
            <a href={`/api/card/${animalId}?formato=story&baixar=1`} className="btn-ghost min-h-10 bg-white px-3 text-sm">{t('Baixar stories')}</a>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="label">{t('Legenda pronta')}</span>
            <textarea readOnly value={caption.replace('{url}', `…/animais/${animalId}`)} rows={6} className="field h-auto py-3 text-sm" />
          </label>
          <button type="button" className="btn-ghost min-h-10 self-start bg-white px-3 text-sm"
            onClick={async () => { await navigator.clipboard.writeText(full()); setCopied(true); setTimeout(() => setCopied(false), 2500); }}>
            {copied ? t('Legenda copiada') : t('Copiar legenda')}
          </button>
        </div>
      </div>
    </section>
  );
}
