export const metadata = { title: 'Termo de adoção' };

// Modelo padrão da plataforma (padrao-v1). RASCUNHO — revisar com advogado antes do lançamento.
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 leading-relaxed text-ink-2 [&_li]:ml-5 [&_li]:list-decimal">
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
