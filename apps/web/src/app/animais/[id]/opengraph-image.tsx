import { headers } from 'next/headers';
import { getLang } from '@/i18n/server';
import { CARD_SIZES, loadCardAnimal, renderAnimalCard } from '@/lib/animal-card';

// Prévia do link do animal (WhatsApp, Instagram, Facebook mostram esta imagem ao colar o link).
export const size = { width: CARD_SIZES.og[0], height: CARD_SIZES.og[1] };
export const contentType = 'image/png';
export const alt = 'Animal para adoção no Vira Lar';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await loadCardAnimal(id);
  if (!a) return new Response('Not found', { status: 404 });
  return renderAnimalCard(a, 'og', await getLang(), (await headers()).get('host') ?? 'viralar');
}
