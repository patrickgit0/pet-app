import { getI18n, pageTitle } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { formatCnpj, speciesText } from '@adotai/shared';
import { getSession } from '@/lib/supabase/server';
import { TermClauses } from '@/components/term-clauses';
import { PrintButton } from './print-button';

export const generateMetadata = pageTitle('Termo de adoção');

/** Cópia do termo aceito (adotante ou ONG). "Salvar em PDF" usa a impressão do navegador. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSession();
  const { t, lang, locale } = await getI18n();
  const { data: a } = await supabase.from('adoptions')
    .select('id, adopted_at, term_accepted_at, term_version, animals(name, species, breed, sex), ngos(name, cnpj), profiles!adoptions_adopter_id_fkey(full_name)')
    .eq('id', id).maybeSingle();
  if (!a || !a.term_accepted_at) notFound();
  const dt = (d: string) => new Date(d).toLocaleString(locale, { timeZone: 'America/Sao_Paulo', dateStyle: 'long', timeStyle: 'short' });
  const animal = a.animals;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10 [&_li]:ml-5 [&_li]:list-decimal print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">{t('Use "Salvar como PDF" na janela de impressão.')}</p>
        <PrintButton />
      </div>
      <h1 className="text-3xl font-extrabold text-ink">{t('Termo de adoção responsável')}</h1>
      <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-xl border border-line p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted">{t('Adotante')}</dt><dd className="font-semibold text-ink">{a.profiles?.full_name}</dd></div>
        <div><dt className="text-xs text-muted">{t('ONG')}</dt><dd className="font-semibold text-ink">{a.ngos?.name}{a.ngos?.cnpj ? ` · CNPJ ${formatCnpj(a.ngos.cnpj)}` : ''}</dd></div>
        <div><dt className="text-xs text-muted">{t('Animal')}</dt><dd className="font-semibold text-ink">{animal?.name} · {animal ? t(speciesText(animal.species, animal.breed)) : ''}</dd></div>
        <div><dt className="text-xs text-muted">{t('Adoção registrada em')}</dt><dd className="font-semibold text-ink">{dt(a.adopted_at)}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-muted">{t('Aceite digital')}</dt><dd className="font-semibold text-ink">{dt(a.term_accepted_at)} · {t('versão {v}', { v: a.term_version ?? 'padrao-v1' })} · {t('código {c}', { c: a.id.slice(0, 8).toUpperCase() })}</dd></div>
      </dl>
      <TermClauses lang={lang === 'en' ? 'en' : 'pt'} />
      <p className="mt-8 text-xs text-muted">{t('Aceite feito pelo adotante na própria conta no Adotaí, com data e hora registradas. Modelo padrão em revisão jurídica.')}</p>
    </main>
  );
}
