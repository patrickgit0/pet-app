'use client';

import { useI18n } from '@/i18n/client';
import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL } from '@adotai/shared';

// O worker do MapLibre é servido de /public (copiado no build): o bundler do Next quebra o caminho padrão.
maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');

export type MapPin = { id: string; href: string; label: string; lat: number; lng: number };

/**
 * Mapa gratuito: MapLibre + OpenFreeMap (OpenStreetMap). Sem chave, sem custo.
 * Os pinos usam coordenadas arredondadas (~1 km), nunca o endereço exato.
 */
export function MapView({ center, radiusKm, pins }: { center: { lat: number; lng: number }; radiusKm: number; pins: MapPin[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: MAP_STYLE_URL,
      center: [center.lng, center.lat],
      zoom: radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : radiusKm <= 25 ? 11 : 10,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    // Créditos do OpenStreetMap ficam recolhidos no botão "i" (exigência da licença, sem tampar o mapa)
    map.once('load', () => ref.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));

    // Agrupa animais no mesmo ponto arredondado
    const groups = new Map<string, MapPin[]>();
    for (const p of pins) {
      const k = `${p.lat},${p.lng}`;
      groups.set(k, [...(groups.get(k) ?? []), p]);
    }
    const markers: maplibregl.Marker[] = [];
    for (const list of groups.values()) {
      const el = document.createElement('a');
      el.href = list.length === 1 ? list[0].href : '#resultados';
      el.textContent = list.length === 1 ? list[0].label : String(list.length);
      el.className = 'rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-md';
      el.setAttribute('aria-label', list.map((p) => p.label).join(', '));
      markers.push(new maplibregl.Marker({ element: el }).setLngLat([list[0].lng, list[0].lat]).addTo(map));
    }
    const me = document.createElement('span');
    me.className = 'block h-4 w-4 rounded-full border-[3px] border-white bg-accent shadow';
    markers.push(new maplibregl.Marker({ element: me }).setLngLat([center.lng, center.lat]).addTo(map));

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, [center.lat, center.lng, radiusKm, pins]);

  return <div ref={ref} role="region" aria-label={t('Mapa com a região dos animais')} className="h-[220px] w-full sm:h-[320px] xl:h-[560px] overflow-hidden rounded-2xl border border-line-2 bg-[#E3E8E2]" />;
}
