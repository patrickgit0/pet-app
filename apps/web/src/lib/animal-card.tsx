import { ImageResponse } from 'next/og';
import { formatAge, sexLabel, SIZE_LABEL, SPECIES_LABEL, type Lang } from '@adotai/shared';
import { createClient } from '@/lib/supabase/server';
import { makeT } from '@/i18n';
import { photoUrl } from '@/lib/utils';

/** Formatos da imagem de divulgação. og = prévia de link (WhatsApp, redes); feed = post 4:5; story = 9:16. */
export const CARD_SIZES = { og: [1200, 630], feed: [1080, 1350], story: [1080, 1920] } as const;
export type CardFormat = keyof typeof CARD_SIZES;

const BRAND = '#0F6E5C', ACCENT = '#E8833A', INK = '#1B1F1D', GROUND = '#F6F7F5';

export async function loadCardAnimal(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('animals')
    .select('id, name, species, sex, size, birth_date_estimate, neutered, vaccinated, ngos(name, city, state), animal_photos(storage_path, position)')
    .eq('id', id).maybeSingle();
  return data;
}

type CardAnimal = NonNullable<Awaited<ReturnType<typeof loadCardAnimal>>>;

const ageMonths = (b: string | null) => {
  if (!b) return null;
  const d = new Date(b), n = new Date();
  return (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());
};

/** Desenha o card do animal (foto grande, nome, características, ONG, chamada "Adote no Adotaí"). */
export function renderAnimalCard(a: CardAnimal, format: CardFormat, lang: Lang, siteHost: string) {
  const t = makeT(lang);
  const [w, h] = CARD_SIZES[format];
  const photos = [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position);
  const photo = photoUrl(photos[0]?.storage_path);
  const facts = [t(SPECIES_LABEL[a.species]), t(sexLabel(a.sex)), formatAge(ageMonths(a.birth_date_estimate), lang), `${t('Porte')} ${t(SIZE_LABEL[a.size]).toLowerCase()}`];
  const tags = [a.neutered && t('Castrado'), a.vaccinated && t('Vacinado')].filter(Boolean) as string[];
  const wide = format === 'og';
  const s = w / 1080; // escala de tipografia

  const photoBox = (
    <div style={{ display: 'flex', flex: wide ? '0 0 50%' : '1 1 auto', background: '#E3E8E2', overflow: 'hidden', borderRadius: wide ? 0 : 40 * s }}>
      {photo
        ? // eslint-disable-next-line @next/next/no-img-element -- ImageResponse (satori) só aceita <img>
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 160 * s, color: '#9AA39F' }}>{a.name.slice(0, 1)}</div>}
    </div>
  );

  const info = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: (wide ? 14 : 18) * s, padding: wide ? '40px 48px' : `${44 * s}px ${12 * s}px 0`, flex: wide ? '1 1 0' : '0 0 auto', justifyContent: wide ? 'center' : 'flex-start' }}>
      <div style={{ display: 'flex', fontSize: (wide ? 24 : 34) * s, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>{t('PARA ADOÇÃO').toUpperCase()}</div>
      <div style={{ display: 'flex', fontSize: (wide ? 76 : 110) * s, fontWeight: 800, color: INK, lineHeight: 1.05 }}>{a.name}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: (wide ? 28 : 40) * s, color: '#3A423E', lineHeight: 1.3 }}>{facts.filter(Boolean).join(' · ')}</div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 12 * s }}>
          {tags.map((x) => <div key={x} style={{ display: 'flex', background: '#E6F2EE', color: '#0A4F42', borderRadius: 12 * s, padding: `${8 * s}px ${18 * s}px`, fontSize: (wide ? 24 : 32) * s, fontWeight: 700 }}>{x}</div>)}
        </div>
      )}
      <div style={{ display: 'flex', fontSize: (wide ? 24 : 34) * s, color: '#5B635F', lineHeight: 1.3 }}>{a.ngos?.name}{a.ngos?.city ? ` · ${a.ngos.city}/${a.ngos.state}` : ''}</div>
    </div>
  );

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BRAND, color: 'white', padding: wide ? '0px 56px' : `${34 * s}px ${48 * s}px`, height: wide ? 96 : 'auto', borderRadius: wide ? 0 : 32 * s, marginTop: wide ? 0 : 36 * s }}>
      <div style={{ display: 'flex', fontSize: (wide ? 36 : 52) * s, fontWeight: 800 }}>Adotaí</div>
      <div style={{ display: 'flex', fontSize: (wide ? 26 : 34) * s, fontWeight: 600 }}>{t('Adote em')} {siteHost}</div>
    </div>
  );

  return new ImageResponse(
    wide ? (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'white' }}>
        <div style={{ display: 'flex', flex: '1 1 auto' }}>{photoBox}{info}</div>
        {footer}
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: GROUND, padding: 48 * s }}>
        {photoBox}
        {info}
        {footer}
      </div>
    ),
    { width: w, height: h },
  );
}
