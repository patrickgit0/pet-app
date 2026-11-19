import { getI18n, pageTitle } from '@/i18n/server';
import { TermClauses } from '@/components/term-clauses';

export const generateMetadata = pageTitle('Termo de adoção');

// Modelo padrão da plataforma (padrao-v1). RASCUNHO — revisar com advogado antes do lançamento.
export default async function Page() {
  const { lang } = await getI18n();
  if (lang === 'en') return <TermEn />;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 leading-relaxed text-ink-2 [&_li]:ml-5 [&_li]:list-decimal">
      <h1 className="text-3xl font-extrabold text-ink">Termo de adoção responsável</h1>
      <p className="mt-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">Modelo padrão Adotaí (versão padrao-v1) · rascunho em revisão jurídica.</p>
      <TermClauses lang="pt" />
    </main>
  );
}

function TermEn() {
  return (
    <main lang="en" className="mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10 [&_li]:ml-5 [&_li]:list-decimal">
      <h1 className="text-3xl font-extrabold text-ink">Responsible adoption agreement</h1>
      <p className="mt-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
        Adotaí standard template (version padrao-v1) · draft under legal review. Courtesy translation; the Portuguese version prevails.
      </p>
      <TermClauses lang="en" />
    </main>
  );
}
