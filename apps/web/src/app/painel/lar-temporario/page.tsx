import { SIZE_LABEL, SPECIES_PLURAL, formatPhone } from '@viralar/shared';
import { getI18n, pageTitle } from '@/i18n/server';
import { getMyNgo } from '@/lib/ngo';
import { WhatsAppGlyph } from '@/components/whatsapp-glyph';

export const generateMetadata = pageTitle('Lar temporário');

/** Voluntários de lar temporário (só ONG verificada vê). Contato direto pelo WhatsApp. */
export default async function Page() {
  const { supabase, ngo } = await getMyNgo();
  const { t, locale } = await getI18n();
  if (!ngo!.verified_at) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold">{t('Lar temporário')}</h1>
        <p className="card p-6 text-sm text-muted">{t('A lista de voluntários de lar temporário aparece depois que a ONG for verificada pela equipe do Vira Lar.')}</p>
      </div>
    );
  }
  const { data: offers } = await supabase.rpc('list_foster_offers');
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{t('Lar temporário')}</h1>
        <p className="text-sm text-muted">{t('Pessoas que se ofereceram para abrigar um animal por um tempo. Combine pelo WhatsApp e, quando der certo, avise a pessoa por lá.')}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {(offers ?? []).map((o) => {
          const msg = t('Olá, {name}! Somos da {ngo} e vimos no Vira Lar que você se ofereceu como lar temporário. Podemos conversar?', { name: o.full_name.split(' ')[0], ngo: ngo!.name });
          return (
            <li key={o.user_id} className="card flex flex-col gap-2 p-4 text-sm">
              <strong className="text-base">{o.full_name}</strong>
              <span className="text-muted">{[o.neighborhood, o.city].filter(Boolean).join(', ') || t('Bairro não informado')}</span>
              <span>{o.species.map((s) => t(SPECIES_PLURAL[s])).join(', ')} · {o.sizes.map((s) => t(SIZE_LABEL[s]).toLowerCase()).join(', ')}</span>
              <span>{o.max_weeks === 1 ? t('Até 1 semana') : t('Até {n} semanas', { n: o.max_weeks })}{o.has_other_pets != null ? ` · ${o.has_other_pets ? t('tem outros animais') : t('sem outros animais')}` : ''}</span>
              {o.notes && <p className="rounded-xl bg-ground p-3 text-ink-2">{o.notes}</p>}
              <span className="text-xs text-muted">{t('Atualizado em {d}', { d: new Date(o.updated_at).toLocaleDateString(locale) })}</span>
              {o.contact_phone && (
                <a href={`https://wa.me/${o.contact_phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="btn-primary self-start">
                  <WhatsAppGlyph /> {formatPhone(o.contact_phone.slice(2))}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {!offers?.length && <p className="card p-6 text-center text-sm text-muted">{t('Ninguém se ofereceu ainda. Divulgue a página Seja lar temporário (link no rodapé do site) nas redes da ONG.')}</p>}
    </div>
  );
}
