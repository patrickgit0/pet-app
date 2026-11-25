import Link from 'next/link';
import { getI18n, pageTitle } from '@/i18n/server';
import { createClient } from '@/lib/supabase/server';
import { EventCard } from '@/components/event-card';

export const generateMetadata = pageTitle('Feiras de adoção em Franca');

export default async function Page() {
  const supabase = await createClient();
  const { t } = await getI18n();
  const { data: events } = await supabase.from('ngo_events')
    .select('id, title, starts_at, ends_at, place, neighborhood, city, description, ngos(name, slug)')
    .gte('ends_at', new Date().toISOString()).order('starts_at').limit(50);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-extrabold">{t('Feiras de adoção')}</h1>
      <p className="text-ink-2">{t('Conheça os animais pessoalmente. As feiras são organizadas pelas ONGs do Vira Lar.')}</p>
      {(events ?? []).map((e) => <EventCard key={e.id} e={e} />)}
      {!events?.length && (
        <p className="card p-8 text-center text-muted">
          {t('Nenhuma feira marcada agora.')} <Link href="/" className="font-semibold text-brand">{t('Ver animais para adoção')}</Link>
        </p>
      )}
    </main>
  );
}
