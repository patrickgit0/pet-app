import { getI18n, pageTitle } from '@/i18n/server';
import { TermClauses } from '@/components/term-clauses';

export const generateMetadata = pageTitle('Termo de adoção');

// Modelo padrão da plataforma (versão atual em CURRENT_TERM_VERSION). Sem revisão de advogado (decisão do dono, 19/11).
export default async function Page() {
  const { lang } = await getI18n();
  if (lang === 'en') return <TermEn />;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 leading-relaxed text-ink-2 [&_li]:ml-5 [&_li]:list-decimal">
      <h1 className="text-3xl font-extrabold text-ink">Termo de adoção responsável</h1>
      <TermClauses lang="pt" />
    </main>
  );
}

function TermEn() {
  return (
    <main lang="en" className="mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10 [&_li]:ml-5 [&_li]:list-decimal">
      <h1 className="text-3xl font-extrabold text-ink">Responsible adoption agreement</h1>
      <p className="mt-2 text-sm text-muted">Courtesy translation; the Portuguese version prevails.</p>
      <TermClauses lang="en" />
    </main>
  );
}
