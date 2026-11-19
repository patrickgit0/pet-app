import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PILOT_CITY } from '@adotai/shared';
import { getI18n } from '@/i18n/server';
import { createClient } from '@/lib/supabase/server';
import { LANDINGS, SITE_URL, type LandingSlug } from '@/lib/site';
import { AnimalCard } from '@/components/animal-card';

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false; // slug fora da lista = 404

export function generateStaticParams() {
  return Object.keys(LANDINGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const l = LANDINGS[(await params).slug as LandingSlug];
  if (!l) return {};
  const { t } = await getI18n();
  return {
    title: t(l.title),
    description: t('{title}: animais de ONGs verificadas, com foto, idade e porte. Converse com a ONG e peça a adoção pelo Adotaí, de graça.', { title: t(l.title) }),
    alternates: { canonical: `/adotar/${(await params).slug}` },
  };
}

const FAQ = [
  ['Quanto custa adotar?', 'Usar o Adotaí é gratuito. Algumas ONGs pedem uma taxa para ajudar com vacinas e castração: pergunte na conversa antes de enviar o pedido.'],
  ['Como funciona a adoção?', 'Você cria uma conta, conversa com a ONG pelo site e envia o pedido de adoção. A ONG analisa seu perfil, pode marcar uma visita e, se aprovar, combina a entrega com você.'],
  ['Preciso ter casa com quintal?', 'Não. Cada anúncio mostra se o animal se adapta a apartamento, crianças e outros animais. Use os filtros para encontrar o que combina com a sua rotina.'],
  ['E depois da adoção?', 'O Adotaí acompanha os primeiros meses com check-ins rápidos (7, 30, 90 e 180 dias). Se algo não estiver bem, você pede ajuda à ONG pelo próprio site.'],
] as const;

export default async function Landing({ params }: Params) {
  const { slug } = await params;
  const l = LANDINGS[slug as LandingSlug];
  if (!l) notFound();
  const { t } = await getI18n();
  const supabase = await createClient();
  const { data: animals } = await supabase.rpc('search_animals', {
    p_lat: PILOT_CITY.lat, p_lng: PILOT_CITY.lng, p_radius_km: 50,
    p_species: l.species ? [l.species] : undefined,
    p_age_groups: 'ages' in l ? [...l.ages] : undefined,
    p_sort: 'recommended', p_limit: 24, p_offset: 0,
  });
  const total = Number(animals?.[0]?.total_count ?? 0);
  const searchHref = `/?${new URLSearchParams([...(l.species ? [['especie', l.species]] : []), ...('ages' in l ? l.ages.map((a) => ['idade', a]) : [])]).toString()}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Adotaí', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t(l.title), item: `${SITE_URL}/adotar/${slug}` },
      ] },
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: t(q), acceptedAnswer: { '@type': 'Answer', text: t(a) } })) },
    ],
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t(l.h1)}</h1>
        <p className="max-w-2xl text-ink-2">
          {t('{n} animais esperando por um lar em Ribeirão Preto e região, todos de ONGs cadastradas com CNPJ. Veja fotos, converse com a ONG e peça a adoção sem sair de casa.', { n: total })}
        </p>
        <Link href={searchHref} className="btn-primary mt-2 self-start">{t('Ver todos com filtros e mapa')}</Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">
        {(animals ?? []).map((a) => <AnimalCard key={a.id} a={{ ...a, distance_km: null }} />)}
        {!animals?.length && <p className="col-span-full card p-8 text-center text-muted">{t('Nenhum animal disponível agora. Volte em breve: as ONGs publicam toda semana.')}</p>}
      </section>

      <section className="card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">{t('Perguntas frequentes')}</h2>
        {FAQ.map(([q, a]) => (
          <div key={q}>
            <h3 className="font-bold">{t(q)}</h3>
            <p className="text-sm text-ink-2">{t(a)}</p>
          </div>
        ))}
      </section>

      <nav aria-label={t('Outras buscas')} className="flex flex-wrap gap-2 text-sm">
        {(Object.keys(LANDINGS) as LandingSlug[]).filter((s) => s !== slug).map((s) => (
          <Link key={s} href={`/adotar/${s}`} className="rounded-full border border-line bg-white px-3 py-2 font-semibold hover:border-brand">{t(LANDINGS[s].h1)}</Link>
        ))}
      </nav>
    </main>
  );
}
