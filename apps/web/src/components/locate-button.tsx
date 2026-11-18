'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PinIcon } from './icons';

/** Usa a localização do navegador (com permissão) para centralizar a busca. */
export function LocateButton() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="btn-ghost"
        disabled={busy}
        onClick={() => {
          if (!navigator.geolocation) return setErr('Seu navegador não permite localização.');
          setBusy(true);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const p = new URLSearchParams(params.toString());
              p.set('lat', pos.coords.latitude.toFixed(4));
              p.set('lng', pos.coords.longitude.toFixed(4));
              p.delete('page');
              router.push(`/?${p.toString()}`);
              setBusy(false);
            },
            () => {
              setErr('Não conseguimos sua localização.');
              setBusy(false);
            },
          );
        }}
      >
        <PinIcon size={18} className="text-brand" />
        {busy ? 'Localizando…' : 'Usar minha localização'}
      </button>
      {err && <span className="text-xs text-red-700">{err}</span>}
    </div>
  );
}
