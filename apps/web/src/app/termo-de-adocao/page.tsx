import { getI18n, pageTitle } from '@/i18n/server';

export const generateMetadata = pageTitle('Termo de adoção');

// Modelo padrão da plataforma (padrao-v1). RASCUNHO — revisar com advogado antes do lançamento.
export default async function Page() {
  const { lang } = await getI18n();
  if (lang === 'en') return <TermEn />;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 leading-relaxed text-ink-2 [&_li]:ml-5 [&_li]:list-decimal">
      <h1 className="text-3xl font-extrabold text-ink">Termo de adoção responsável</h1>
      <p className="mt-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">Modelo padrão Adotaí (versão padrao-v1) · rascunho em revisão jurídica.</p>
      <p className="mt-6">Ao aceitar este termo, o(a) adotante se compromete a:</p>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Oferecer alimentação adequada, água limpa, abrigo e cuidados veterinários ao animal.</li>
        <li>Manter a vacinação e a vermifugação em dia e realizar a castração, se ainda não tiver sido feita, no prazo combinado com a ONG.</li>
        <li>Não abandonar, vender, doar ou repassar o animal a terceiros. Em caso de impossibilidade de manter o animal, comunicar a ONG pelo Adotaí para que ela decida o novo destino.</li>
        <li>Não manter o animal acorrentado nem em espaço inadequado ao seu porte.</li>
        <li>Responder aos check-ins de acompanhamento pelo app (7, 30, 90 e 180 dias) e permitir que a ONG acompanhe a adaptação.</li>
        <li>Informar mudança de endereço ou de telefone.</li>
      </ol>
      <p className="mt-6">O descumprimento deste termo pode levar a ONG a solicitar a devolução do animal. Maus-tratos são crime (Lei 9.605/98, art. 32).</p>
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
      <p className="mt-6">By accepting this agreement, the adopter commits to:</p>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Provide the animal with proper food, clean water, shelter and veterinary care.</li>
        <li>Keep vaccinations and deworming up to date and have the animal spayed/neutered, if not done yet, within the period agreed with the shelter.</li>
        <li>Not abandon, sell, give away or transfer the animal to third parties. If unable to keep the animal, notify the shelter through Adotaí so it can decide the animal&apos;s new home.</li>
        <li>Not keep the animal chained or in a space unsuitable for its size.</li>
        <li>Answer the follow-up check-ins in the app (7, 30, 90 and 180 days) and allow the shelter to follow the animal&apos;s adaptation.</li>
        <li>Report any change of address or phone number.</li>
      </ol>
      <p className="mt-6">Breach of this agreement may lead the shelter to request the animal&apos;s return. Animal cruelty is a crime in Brazil (Law 9.605/98, art. 32).</p>
    </main>
  );
}
