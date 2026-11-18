// Copia o worker do MapLibre para public/ (o mapa carrega de /maplibre-gl-worker.mjs).
import { copyFileSync, existsSync } from 'node:fs';
const from = ['node_modules', '../../node_modules'].map((d) => `${d}/maplibre-gl/dist/maplibre-gl-worker.mjs`).find(existsSync);
if (!from) throw new Error('maplibre-gl não encontrado');
copyFileSync(from, 'public/maplibre-gl-worker.mjs');
