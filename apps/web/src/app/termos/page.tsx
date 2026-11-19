import { getI18n, pageTitle } from '@/i18n/server';

export const generateMetadata = pageTitle('Termos de uso');

const MAIN = 'mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc';

// RASCUNHO — precisa de revisão jurídica antes do lançamento.
export default async function Page() {
  const { lang } = await getI18n();
  if (lang === 'en') return <TermsEn />;
  return (
    <main className={MAIN}>
      <h1 className="text-3xl font-extrabold text-ink">Termos de uso</h1>
      <p className="mt-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">Rascunho em revisão jurídica. Última atualização: novembro de 2026.</p>

      <h2>O que é o Adotaí</h2>
      <p>O Adotaí é uma plataforma gratuita que aproxima organizações de proteção animal (ONGs com CNPJ) de pessoas que querem adotar. O Adotaí não é dono dos animais, não faz resgates e não decide as adoções: quem analisa os pedidos e entrega os animais é a ONG responsável.</p>

      <h2>Contas</h2>
      <ul>
        <li>Você precisa ter 18 anos ou mais para pedir uma adoção.</li>
        <li>As informações do seu perfil devem ser verdadeiras. CPF é único por conta.</li>
        <li>Você é responsável por manter sua senha em segredo.</li>
      </ul>

      <h2>Regras para todos</h2>
      <ul>
        <li>É proibido vender animais ou cobrar valores além da taxa de adoção informada pela ONG.</li>
        <li>É proibido usar o Adotaí para golpes, assédio, ofensas ou para pedir dados pessoais de forma abusiva.</li>
        <li>Fotos e textos publicados devem ser seus ou autorizados, e não podem expor dados pessoais de terceiros.</li>
        <li>Use o botão &quot;Denunciar&quot; se encontrar algo errado. Podemos remover conteúdo e suspender contas que descumpram estas regras.</li>
      </ul>

      <h2>Regras para ONGs</h2>
      <ul>
        <li>Só ONGs com CNPJ podem anunciar. A verificação pela equipe do Adotaí pode exigir documentos.</li>
        <li>A ONG é responsável pelos anúncios, pela saúde informada dos animais, pela análise dos pedidos e pela entrega.</li>
        <li>A ONG usa os dados dos adotantes apenas para avaliar e acompanhar a adoção, nunca para outras finalidades.</li>
        <li>Doações por Pix vão direto para a ONG. O Adotaí não recebe nem intermedeia esses valores.</li>
      </ul>

      <h2>Regras para adotantes</h2>
      <ul>
        <li>Ao adotar, você aceita o <a className="font-bold text-brand" href="/termo-de-adocao">Termo de adoção responsável</a>.</li>
        <li>Responder aos check-ins de acompanhamento ajuda a ONG e entra na avaliação do processo.</li>
      </ul>

      <h2>Responsabilidades</h2>
      <p>O Adotaí se esforça para manter as informações corretas e o serviço no ar, mas não garante que o serviço funcione sem interrupções nem responde pelo comportamento de usuários e ONGs. Maus-tratos são crime (Lei 9.605/98, art. 32): denuncie também às autoridades.</p>

      <h2>Privacidade</h2>
      <p>O uso dos seus dados está descrito na <a className="font-bold text-brand" href="/privacidade">Política de Privacidade</a>.</p>

      <h2>Mudanças</h2>
      <p>Podemos atualizar estes termos. Mudanças importantes serão avisadas no site.</p>
    </main>
  );
}

function TermsEn() {
  return (
    <main lang="en" className={MAIN}>
      <h1 className="text-3xl font-extrabold text-ink">Terms of use</h1>
      <p className="mt-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">Draft under legal review. Last updated: November 2026. Courtesy translation; the Portuguese version prevails.</p>

      <h2>What Adotaí is</h2>
      <p>Adotaí is a free platform that connects animal welfare organizations (registered shelters) with people who want to adopt. Adotaí does not own the animals, does not rescue them and does not decide adoptions: the responsible shelter reviews the requests and hands over the animals.</p>

      <h2>Accounts</h2>
      <ul>
        <li>You must be 18 or older to request an adoption.</li>
        <li>Your profile information must be true. Each CPF can only be used by one account.</li>
        <li>You are responsible for keeping your password secret.</li>
      </ul>

      <h2>Rules for everyone</h2>
      <ul>
        <li>Selling animals or charging more than the adoption fee stated by the shelter is forbidden.</li>
        <li>Using Adotaí for scams, harassment, abuse or to abusively request personal data is forbidden.</li>
        <li>Photos and texts you post must be yours or authorized, and must not expose other people&apos;s personal data.</li>
        <li>Use the &quot;Report&quot; button if you find something wrong. We may remove content and suspend accounts that break these rules.</li>
      </ul>

      <h2>Rules for shelters</h2>
      <ul>
        <li>Only registered shelters (CNPJ) can post. Verification by the Adotaí team may require documents.</li>
        <li>The shelter is responsible for its listings, the stated health of the animals, reviewing requests and the handover.</li>
        <li>The shelter uses adopters&apos; data only to evaluate and follow up the adoption, never for other purposes.</li>
        <li>Pix donations go straight to the shelter. Adotaí does not receive or intermediate these amounts.</li>
      </ul>

      <h2>Rules for adopters</h2>
      <ul>
        <li>When adopting, you accept the <a className="font-bold text-brand" href="/termo-de-adocao">Responsible adoption agreement</a>.</li>
        <li>Answering the follow-up check-ins helps the shelter and is part of the process.</li>
      </ul>

      <h2>Liability</h2>
      <p>Adotaí strives to keep information accurate and the service available, but does not guarantee uninterrupted service and is not liable for the behavior of users and shelters. Animal cruelty is a crime in Brazil (Law 9.605/98, art. 32): also report it to the authorities.</p>

      <h2>Privacy</h2>
      <p>How your data is used is described in the <a className="font-bold text-brand" href="/privacidade">Privacy Policy</a>.</p>

      <h2>Changes</h2>
      <p>We may update these terms. Important changes will be announced on the site.</p>
    </main>
  );
}
