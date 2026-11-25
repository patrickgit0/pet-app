'use client';

import { useI18n } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatCep, lookupCep } from '@viralar/shared';
import { PinIcon } from './icons';
import { SEARCH_LOCATION_COOKIE } from '@/lib/cookie-names';

/**
 * Centraliza a busca na localização do navegador (com permissão) ou num CEP digitado.
 * O CEP é o plano B: no desktop a localização costuma falhar (Windows com localização desligada, sem Wi-Fi).
 */
export function LocateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showCep, setShowCep] = useState(false);
  const [cep, setCep] = useState('');
  const { t } = useI18n();

  // Guarda o centro da busca num cookie (não na URL) e recarrega a busca no servidor
  function go(lat: number, lng: number, label?: string) {
    const value = encodeURIComponent(JSON.stringify({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)), label: label ?? null }));
    document.cookie = `${SEARCH_LOCATION_COOKIE}=${value}; path=/; max-age=2592000; samesite=lax`;
    router.refresh();
  }

  function locate() {
    setErr(null);
    if (!navigator.geolocation) {
      setShowCep(true);
      return setErr(t('Seu navegador não informa a localização. Use o CEP.'));
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        go(pos.coords.latitude, pos.coords.longitude);
      },
      (e) => {
        setBusy(false);
        setShowCep(true);
        setErr(
          e.code === e.PERMISSION_DENIED
            ? t('Localização bloqueada. Libere no cadeado ao lado do endereço do site, ou use o CEP.')
            : e.code === e.TIMEOUT
              ? t('Demorou demais para achar sua localização. Tente de novo ou use o CEP.')
              : t('Não conseguimos sua localização (no computador, confira se a localização do sistema está ligada). Use o CEP.'),
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  async function byCep(e?: { preventDefault(): void }) {
    e?.preventDefault();
    setErr(null);
    if (cep.replace(/\D/g, '').length !== 8) return setErr(t('Digite os 8 números do CEP.'));
    setBusy(true);
    const r = await lookupCep(cep);
    setBusy(false);
    if (!r || r.lat == null || r.lng == null) return setErr(t('Não encontramos esse CEP.'));
    go(r.lat, r.lng, [r.neighborhood, r.city].filter(Boolean).join(', '));
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn-ghost" disabled={busy} onClick={locate}>
        <PinIcon size={18} className="text-brand" />
        {busy ? t('Localizando…') : t('Usar minha localização')}
      </button>
      {showCep ? (
        // div (não form): este componente fica dentro do formulário de filtros
        <div className="flex gap-2">
          <input value={cep} onChange={(e) => setCep(formatCep(e.target.value))} onKeyDown={(e) => { if (e.key === 'Enter') byCep(e); }}
            inputMode="numeric" autoComplete="postal-code" placeholder={t('Seu CEP')} aria-label={t('CEP')} className="field h-11 min-w-0 flex-1 text-sm" />
          <button type="button" onClick={byCep} disabled={busy} className="btn-primary min-h-11 px-3">Ok</button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowCep(true)} className="self-start text-xs font-semibold text-brand">{t('Ou buscar por CEP')}</button>
      )}
      {err && <span role="alert" className="text-xs text-red-700">{err}</span>}
    </div>
  );
}
