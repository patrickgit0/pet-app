/**
 * Cláusulas do termo padrão. Usado na página pública (versão atual) e na cópia do adotante (versão que ele aceitou).
 * NUNCA altere o texto de uma versão já publicada: crie uma nova (padrao-v3…) e mude o default em adoptions.term_version.
 */
export const CURRENT_TERM_VERSION = 'padrao-v2';

export function TermClauses({ lang, version = CURRENT_TERM_VERSION }: { lang: 'pt' | 'en'; version?: string | null }) {
  if (version === 'padrao-v1') return lang === 'en' ? <V1En /> : <V1Pt />;
  return lang === 'en' ? <V2En /> : <V2Pt />;
}

function V2Pt() {
  return (
    <>
      <p className="mt-6">
        Este termo é firmado entre a ONG responsável e o(a) adotante identificados na cópia da adoção. A ONG concorda com ele ao
        confirmar a adoção no Adotaí, e o(a) adotante ao tocar em &quot;Li e aceito&quot; na própria conta.
      </p>

      <h2 className="mt-6 font-extrabold text-ink">Compromissos do(a) adotante</h2>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Assumir a guarda e a responsabilidade pelo animal a partir da entrega, por toda a vida dele.</li>
        <li>Oferecer alimentação adequada, água limpa, abrigo protegido de sol, chuva e frio, higiene, atividade compatível com a espécie e a idade, e convívio com a família.</li>
        <li>Levar o animal ao veterinário sempre que necessário, manter vacinas e vermífugo em dia e realizar a castração, se ainda não tiver sido feita, no prazo combinado com a ONG.</li>
        <li>Não manter o animal acorrentado, preso em espaço pequeno ou inadequado ao porte, nem solto na rua sem supervisão. Usar identificação (plaquinha ou microchip) e, para gatos, telas de proteção quando a ONG recomendar.</li>
        <li>Não abandonar, vender, trocar, doar ou repassar o animal a outras pessoas, nem usá-lo para reprodução, comércio ou qualquer atividade que cause sofrimento.</li>
        <li>Se não puder mais ficar com o animal, avisar a ONG pelo Adotaí e devolvê-lo a ela, que decide o novo lar.</li>
        <li>Responder aos acompanhamentos pelo Adotaí (7, 30, 90 e 180 dias), com fotos quando pedido, e atender ao contato da ONG. Visitas presenciais só com agendamento e concordância do(a) adotante.</li>
        <li>Avisar a ONG em caso de mudança de endereço, telefone ou cidade, fuga ou perda (imediatamente) e morte do animal.</li>
      </ol>

      <h2 className="mt-6 font-extrabold text-ink">Compromissos da ONG</h2>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Informar com honestidade o que sabe sobre a saúde, o comportamento e o histórico do animal.</li>
        <li>Orientar o(a) adotante na adaptação e responder às dúvidas durante o acompanhamento.</li>
        <li>Receber o animal de volta se o(a) adotante não puder mais ficar com ele.</li>
        <li>Usar os dados do(a) adotante só para avaliar e acompanhar esta adoção.</li>
      </ol>

      <h2 className="mt-6 font-extrabold text-ink">Disposições gerais</h2>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Se houver taxa de adoção, ela deve estar escrita no anúncio antes do pedido e serve para cobrir custos da ONG com o animal. Este termo não é uma venda.</li>
        <li>Se o(a) adotante descumprir este termo, a ONG pode pedir a devolução do animal. Maus-tratos são crime (Lei 9.605/1998, art. 32); para cães e gatos, a pena é de reclusão de 2 a 5 anos, multa e proibição da guarda (Lei 14.064/2020). Qualquer pessoa pode denunciar às autoridades.</li>
        <li>O Adotaí fornece este modelo e registra o aceite, mas não é parte deste termo e não responde pelas obrigações da ONG ou do(a) adotante.</li>
        <li>As partes concordam que o aceite eletrônico no Adotaí, com data e hora registradas, comprova a concordância com este termo (Medida Provisória 2.200-2/2001, art. 10, § 2º).</li>
        <li>Fica eleito o foro do domicílio do(a) adotante para resolver qualquer questão sobre este termo.</li>
      </ol>
    </>
  );
}

function V2En() {
  return (
    <>
      <p className="mt-6">
        This agreement is made between the responsible shelter and the adopter named on the adoption copy. The shelter agrees to it by
        confirming the adoption on Adotaí, and the adopter by tapping &quot;I have read and accept&quot; in their own account.
      </p>

      <h2 className="mt-6 font-extrabold text-ink">The adopter commits to</h2>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Take custody of and responsibility for the animal from hand-over, for its whole life.</li>
        <li>Provide proper food, clean water, shelter from sun, rain and cold, hygiene, activity suited to its species and age, and family life.</li>
        <li>Take the animal to the vet whenever needed, keep vaccines and deworming up to date and have it spayed/neutered, if not done yet, within the period agreed with the shelter.</li>
        <li>Not keep the animal chained, confined in a small space or one unsuitable for its size, nor loose on the street unsupervised. Use identification (tag or microchip) and, for cats, window screens when the shelter recommends.</li>
        <li>Not abandon, sell, trade, give away or pass the animal on to others, nor use it for breeding, trade or any activity that causes suffering.</li>
        <li>If unable to keep the animal, notify the shelter through Adotaí and return it to the shelter, which decides the new home.</li>
        <li>Answer the follow-ups on Adotaí (7, 30, 90 and 180 days), with photos when asked, and respond to the shelter. In-person visits only by appointment and with the adopter&apos;s agreement.</li>
        <li>Notify the shelter of any change of address, phone or city, escape or loss (immediately) and the animal&apos;s death.</li>
      </ol>

      <h2 className="mt-6 font-extrabold text-ink">The shelter commits to</h2>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Honestly share what it knows about the animal&apos;s health, behavior and history.</li>
        <li>Guide the adopter through the adaptation and answer questions during the follow-up.</li>
        <li>Take the animal back if the adopter can no longer keep it.</li>
        <li>Use the adopter&apos;s data only to evaluate and follow up on this adoption.</li>
      </ol>

      <h2 className="mt-6 font-extrabold text-ink">General provisions</h2>
      <ol className="mt-3 flex flex-col gap-2">
        <li>Any adoption fee must be written on the listing before the request and covers the shelter&apos;s costs with the animal. This agreement is not a sale.</li>
        <li>If the adopter breaches this agreement, the shelter may request the animal&apos;s return. Animal cruelty is a crime in Brazil (Law 9.605/1998, art. 32); for dogs and cats the penalty is 2 to 5 years of imprisonment, a fine and a ban on keeping animals (Law 14.064/2020). Anyone can report it to the authorities.</li>
        <li>Adotaí provides this template and records the acceptance, but is not a party to this agreement and is not liable for the obligations of the shelter or the adopter.</li>
        <li>The parties agree that the electronic acceptance on Adotaí, with date and time recorded, proves their agreement (Provisional Measure 2.200-2/2001, art. 10, § 2).</li>
        <li>The courts of the adopter&apos;s domicile are chosen to settle any matter regarding this agreement.</li>
      </ol>
    </>
  );
}

function V1Pt() {
  return (
    <>
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
    </>
  );
}

function V1En() {
  return (
    <>
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
    </>
  );
}
