import { type NextRequest } from 'next/server';
import { slugify } from '@viralar/shared';
import { getLang } from '@/i18n/server';
import { loadCardAnimal, renderAnimalCard, type CardFormat } from '@/lib/animal-card';

/** Imagem pronta do animal: ?formato=feed|story|og&baixar=1 (para Instagram, WhatsApp e divulgação). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = req.nextUrl.searchParams.get('formato');
  const format: CardFormat = f === 'story' || f === 'og' ? f : 'feed';
  const a = await loadCardAnimal(id);
  if (!a) return new Response('Not found', { status: 404 });
  const img = renderAnimalCard(a, format, await getLang(), req.nextUrl.host);
  const res = new Response(img.body, { headers: new Headers(img.headers) });
  res.headers.set('Cache-Control', 'public, max-age=300');
  if (req.nextUrl.searchParams.get('baixar')) {
    res.headers.set('Content-Disposition', `attachment; filename="viralar-${slugify(a.name)}-${format}.png"`);
  }
  return res;
}
