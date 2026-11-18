export * from './cpf';
export * from './cep';
export * from './labels';
export * from './hours';
export type { Database } from './database.types';

/** Bucket público das fotos dos animais. */
export const ANIMAL_PHOTOS_BUCKET = 'animal-photos';

/** Mapa gratuito, sem chave: OpenFreeMap (dados OpenStreetMap) via MapLibre. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Cidade piloto. */
export const PILOT_CITY = { name: 'Ribeirão Preto', state: 'SP', lat: -21.1775, lng: -47.8103 } as const;
