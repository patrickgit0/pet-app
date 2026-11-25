import { ANIMAL_PHOTOS_BUCKET } from '@viralar/shared';

export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${ANIMAL_PHOTOS_BUCKET}/${path}`;
}

/** Cor de fundo estável por nome, para quando o animal ainda não tem foto. */
const TINTS = ['#F6DCC4', '#D7E7F2', '#E9E3F4', '#DDEFD9', '#F4E4D8', '#E2E6EA'];
export function tintFor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Garante que o redirect pós-login fique dentro do site. */
export function safeNext(next: string | null | undefined, fallback = '/'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
