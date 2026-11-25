// i18n-check: ignore-file (texto PT e EN no próprio arquivo)
import { getI18n, pageTitle } from '@/i18n/server';
import { CONTACT_EMAIL, OPERATOR_NAME } from '@/lib/site';

export const generateMetadata = pageTitle('Termos de uso');

// Sem revisão de advogado (decisão do dono, 19/11). Base: Marco Civil da Internet, CDC, LGPD, Lei 9.605/98 e Lei 14.064/2020.
const MAIN = 'mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1';
const A = 'font-bold text-brand';

function Contact({ missing }: { missing: string }) {
  return CONTACT_EMAIL ? <a className={A} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <strong>[{missing}]</strong>;
}

export default async function Page() {
  const { lang } = await getI18n();
  if (lang === 'en') return <TermsEn />;
  return (
    <main className={MAIN}>
      <h1 className="text-3xl font-extrabold text-ink">Termos de uso</h1>
      <p className="mt-2 text-sm">Última atualização: 19 de novembro de 2026.</p>

      <p className="mt-4">
        Estes termos são as regras para usar o Vira Lar, operado por <strong>{OPERATOR_NAME || '[nome do responsável pelo Vira Lar]'}</strong>.
        Ao criar uma conta, você concorda com eles e com a <a className={A} href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>O que é o Vira Lar</h2>
      <p>
        O Vira Lar é uma plataforma gratuita que aproxima organizações de proteção animal (ONGs com CNPJ) de pessoas que querem adotar.
        O Vira Lar não é dono dos animais, não faz resgates, não vende animais e não decide as adoções: quem analisa os pedidos, escolhe o
        adotante e entrega o animal é a ONG responsável.
      </p>

      <h2>Contas</h2>
      <ul>
        <li>É preciso ter 18 anos ou mais para pedir adoção ou se oferecer como lar temporário.</li>
        <li>As informações do perfil devem ser verdadeiras e suas. Cada CPF só pode ter uma conta.</li>
        <li>Guarde sua senha em segredo. Atividades feitas na sua conta são de sua responsabilidade.</li>
        <li>Você pode excluir sua conta a qualquer momento em Meu perfil.</li>
      </ul>

      <h2>Regras para todos</h2>
      <ul>
        <li>É proibido vender animais ou cobrar qualquer valor além da taxa de adoção escrita no anúncio.</li>
        <li>É proibido usar o Vira Lar para golpes, assédio, ofensas, discriminação, spam ou para pedir dados pessoais sem necessidade.</li>
        <li>É proibido publicar conteúdo ilegal, violento, enganoso ou que exponha dados de outras pessoas.</li>
        <li>Fotos e textos publicados devem ser seus ou autorizados.</li>
        <li>É proibido tentar acessar dados de outras pessoas, copiar o site em massa ou atrapalhar o funcionamento do serviço.</li>
      </ul>

      <h2>Regras para ONGs</h2>
      <ul>
        <li>Só ONGs com CNPJ podem anunciar. A equipe do Vira Lar verifica o cadastro e pode pedir documentos.</li>
        <li>A ONG responde pelos anúncios, pelas informações de saúde e comportamento dos animais, pela análise dos pedidos e pela entrega.</li>
        <li>Os dados dos adotantes só podem ser usados para avaliar e acompanhar a adoção, nunca para outros fins, e devem ser protegidos pela ONG.</li>
        <li>Toda adoção feita pelo Vira Lar usa o <a className={A} href="/termo-de-adocao">Termo de adoção</a> padrão da plataforma.</li>
        <li>Doações por Pix vão direto para a ONG. O Vira Lar não recebe, não guarda e não intermedeia esses valores.</li>
        <li>Feiras de adoção cadastradas são organizadas e de responsabilidade da ONG.</li>
      </ul>

      <h2>Regras para adotantes e lares temporários</h2>
      <ul>
        <li>Ao adotar, você aceita o <a className={A} href="/termo-de-adocao">Termo de adoção responsável</a> com a ONG.</li>
        <li>Responder aos check-ins de acompanhamento faz parte do compromisso com a ONG e com o animal.</li>
        <li>Combinações de lar temporário são feitas diretamente entre você e a ONG. O Vira Lar só mostra sua oferta às ONGs verificadas.</li>
      </ul>

      <h2>Conteúdo que você publica</h2>
      <p>
        Você continua dono das fotos e textos que publica. Ao publicá-los, autoriza o Vira Lar, de graça e enquanto o conteúdo estiver no site, a
        exibi-los na plataforma e a usá-los para divulgar os animais (por exemplo, nas imagens de &quot;Divulgar&quot; e nas prévias de links).
      </p>

      <h2>Denúncias e moderação</h2>
      <p>
        Use o botão &quot;Denunciar&quot; em anúncios, ONGs, avaliações e conversas. A equipe analisa e pode remover conteúdo, pausar anúncios,
        retirar a verificação de ONGs e suspender ou encerrar contas que descumpram estes termos, sempre que possível avisando o motivo.
        Maus-tratos são crime (Lei 9.605/1998, art. 32, com pena maior para cães e gatos pela Lei 14.064/2020): denuncie também à polícia ou ao
        órgão ambiental.
      </p>

      <h2>Responsabilidades</h2>
      <ul>
        <li>O Vira Lar cuida para que o serviço funcione bem e com segurança, mas pode ter interrupções para manutenção ou por falhas de terceiros.</li>
        <li>
          Como não participa das adoções, o Vira Lar não responde pelo que é combinado entre ONG e adotante, pelas informações publicadas pelas ONGs
          nem pelo comportamento de usuários fora da plataforma. Isso não exclui direitos que a lei garante a você.
        </li>
        <li>Pelo conteúdo publicado por usuários, o Vira Lar segue o Marco Civil da Internet (Lei 12.965/2014) e remove o que for ilegal ou contrário a estes termos quando souber.</li>
      </ul>

      <h2>Mudanças</h2>
      <p>
        Podemos atualizar estes termos. A data no topo mostra a versão atual. Mudanças importantes serão avisadas no site com antecedência,
        e continuar usando o Vira Lar depois disso significa concordar com a nova versão.
      </p>

      <h2>Lei e foro</h2>
      <p>
        Estes termos seguem a lei brasileira. Questões serão resolvidas no foro do domicílio do usuário. Antes, fale com a gente:{' '}
        <Contact missing="e-mail de contato a definir" />.
      </p>
    </main>
  );
}

function TermsEn() {
  return (
    <main lang="en" className={MAIN}>
      <h1 className="text-3xl font-extrabold text-ink">Terms of use</h1>
      <p className="mt-2 text-sm">Last updated: November 19, 2026. Courtesy translation; the Portuguese version prevails.</p>

      <p className="mt-4">
        These terms are the rules for using Vira Lar, operated by <strong>{OPERATOR_NAME || '[name of the person responsible for Vira Lar]'}</strong>.
        By creating an account, you agree to them and to the <a className={A} href="/privacidade">Privacy Policy</a>.
      </p>

      <h2>What Vira Lar is</h2>
      <p>
        Vira Lar is a free platform that connects animal welfare organizations (registered shelters with a CNPJ) with people who want to adopt.
        Vira Lar does not own the animals, does not rescue them, does not sell animals and does not decide adoptions: the responsible shelter reviews
        the requests, chooses the adopter and hands over the animal.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must be 18 or older to request an adoption or offer to foster.</li>
        <li>Your profile information must be true and your own. Each CPF can only have one account.</li>
        <li>Keep your password secret. Activity on your account is your responsibility.</li>
        <li>You can delete your account at any time in My profile.</li>
      </ul>

      <h2>Rules for everyone</h2>
      <ul>
        <li>Selling animals or charging anything beyond the adoption fee written on the listing is forbidden.</li>
        <li>Using Vira Lar for scams, harassment, insults, discrimination, spam or to request unnecessary personal data is forbidden.</li>
        <li>Posting illegal, violent or misleading content, or content exposing other people&apos;s data, is forbidden.</li>
        <li>Photos and texts you post must be yours or authorized.</li>
        <li>Trying to access other people&apos;s data, scraping the site or disrupting the service is forbidden.</li>
      </ul>

      <h2>Rules for shelters</h2>
      <ul>
        <li>Only shelters with a CNPJ can post. The Vira Lar team reviews the registration and may ask for documents.</li>
        <li>The shelter is responsible for its listings, the health and behavior information of the animals, reviewing requests and the hand-over.</li>
        <li>Adopter data may only be used to evaluate and follow up on the adoption, never for other purposes, and must be protected by the shelter.</li>
        <li>Every adoption through Vira Lar uses the platform&apos;s standard <a className={A} href="/termo-de-adocao">Adoption agreement</a>.</li>
        <li>Pix donations go straight to the shelter. Vira Lar does not receive, hold or intermediate these amounts.</li>
        <li>Adoption fairs listed are organized by and the responsibility of the shelter.</li>
      </ul>

      <h2>Rules for adopters and foster homes</h2>
      <ul>
        <li>When adopting, you accept the <a className={A} href="/termo-de-adocao">Responsible adoption agreement</a> with the shelter.</li>
        <li>Answering follow-up check-ins is part of your commitment to the shelter and the animal.</li>
        <li>Foster arrangements are made directly between you and the shelter. Vira Lar only shows your offer to verified shelters.</li>
      </ul>

      <h2>Content you post</h2>
      <p>
        You keep ownership of the photos and texts you post. By posting them, you allow Vira Lar, free of charge and while the content is on the site,
        to display them on the platform and use them to promote the animals (for example, in &quot;Promote&quot; images and link previews).
      </p>

      <h2>Reports and moderation</h2>
      <p>
        Use the &quot;Report&quot; button on listings, shelters, reviews and conversations. The team reviews reports and may remove content, pause listings,
        remove a shelter&apos;s verification and suspend or close accounts that break these terms, telling you the reason whenever possible.
        Animal cruelty is a crime in Brazil (Law 9.605/1998, art. 32, with a harsher penalty for dogs and cats under Law 14.064/2020): also report it to the police.
      </p>

      <h2>Liability</h2>
      <ul>
        <li>Vira Lar works to keep the service running well and securely, but it may be interrupted for maintenance or third-party failures.</li>
        <li>
          Since it does not take part in adoptions, Vira Lar is not liable for what is agreed between shelter and adopter, for information posted by shelters
          or for users&apos; behavior outside the platform. This does not remove rights the law guarantees you.
        </li>
        <li>For user-generated content, Vira Lar follows Brazil&apos;s Internet Civil Framework (Law 12.965/2014) and removes illegal content or content against these terms once aware of it.</li>
      </ul>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the current version. Important changes will be announced on the site in advance, and continuing to use Vira Lar afterwards means agreeing to the new version.</p>

      <h2>Law and venue</h2>
      <p>These terms are governed by Brazilian law. Disputes will be settled in the courts of the user&apos;s domicile. Before that, talk to us: <Contact missing="contact email to be defined" />.</p>
    </main>
  );
}
