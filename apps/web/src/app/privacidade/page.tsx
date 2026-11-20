// i18n-check: ignore-file (texto PT e EN no próprio arquivo)
import { getI18n, pageTitle } from '@/i18n/server';
import { CONTACT_EMAIL, OPERATOR_NAME } from '@/lib/site';

export const generateMetadata = pageTitle('Política de Privacidade');

// Texto preparado a partir da LGPD (arts. 7º, 9º, 18, 19, 33, 41, 48), da Resolução CD/ANPD 2/2022 e do Marco Civil.
// Sem revisão de advogado (decisão do dono, 19/11). Ao mudar o que o site coleta ou com quem compartilha, atualize aqui.
const MAIN = 'mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1';

function Email({ missing }: { missing: string }) {
  return CONTACT_EMAIL
    ? <a className="font-bold text-brand" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    : <strong>[{missing}]</strong>;
}

export default async function Page() {
  const { lang } = await getI18n();
  if (lang === 'en') return <PrivacyEn />;
  return (
    <main className={MAIN}>
      <h1 className="text-3xl font-extrabold text-ink">Política de Privacidade</h1>
      <p className="mt-2 text-sm">Última atualização: 19 de novembro de 2026.</p>

      <p className="mt-4">
        Esta política explica quais dados pessoais o Adotaí trata, para quê, com quem compartilha e como você exerce seus direitos
        pela Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <h2>Quem é o responsável</h2>
      <p>
        O Adotaí é operado por <strong>{OPERATOR_NAME || '[nome do responsável pelo Adotaí]'}</strong>, controlador dos dados
        tratados na plataforma. Contato para privacidade: <Email missing="e-mail de contato a definir" />.
      </p>
      <p className="mt-2">
        As ONGs também são controladoras dos dados que recebem dos adotantes para analisar e acompanhar as adoções, e devem usá-los
        só para isso.
      </p>

      <h2>Quais dados tratamos</h2>
      <ul>
        <li><strong>Conta:</strong> nome completo, e-mail e senha (guardada cifrada; ninguém da equipe vê).</li>
        <li><strong>Perfil para adotar:</strong> CPF, celular, CEP, endereço e complemento, tipo de moradia, se tem quintal, crianças e outros animais, e o que você contar sobre sua rotina.</li>
        <li><strong>Localização:</strong> o ponto do seu endereço (para calcular a distância) e o local da busca (a posição do aparelho, se você tocar em &quot;Usar minha localização&quot;, ou o CEP digitado), usado só para ordenar a busca e guardado num cookie no seu navegador por 30 dias.</li>
        <li><strong>O que você cria no site:</strong> pedidos de adoção e respostas às perguntas da ONG, mensagens e fotos do chat, respostas e fotos dos check-ins, avaliações, denúncias, favoritos, buscas salvas e a oferta de lar temporário.</li>
        <li><strong>ONGs:</strong> dados da organização (nome, CNPJ, endereço, contatos, chave Pix) e das pessoas da equipe que usam o painel.</li>
        <li><strong>Dados técnicos:</strong> endereço IP, data e hora de acesso e tipo de navegador, registrados pelos serviços de hospedagem para segurança e funcionamento.</li>
      </ul>
      <p className="mt-2">Não pedimos dados sensíveis (saúde, religião, origem racial etc.). Não escreva esse tipo de informação nas mensagens ou no perfil.</p>

      <h2>Para que usamos e com qual base legal</h2>
      <ul>
        <li><strong>Criar sua conta, mostrar anúncios, enviar pedidos, permitir o chat e o acompanhamento pós-adoção</strong> — execução do serviço que você pediu (LGPD, art. 7º, V).</li>
        <li><strong>Verificar CPF e celular, evitar contas falsas e golpes, proteger os animais e moderar denúncias</strong> — legítimo interesse do Adotaí e dos animais, e prevenção à fraude (art. 7º, IX).</li>
        <li><strong>Calcular a nota das ONGs</strong> — legítimo interesse, usando só dados agregados das adoções, sem expor adotantes.</li>
        <li><strong>Guardar registros técnicos e atender autoridades</strong> — cumprimento de obrigação legal (art. 7º, II), como o Marco Civil da Internet.</li>
        <li><strong>Avisos por e-mail sobre seus pedidos e conversas</strong> — execução do serviço. Não enviamos propaganda.</li>
      </ul>
      <p className="mt-2">Ao completar o perfil, você marca que concorda com o uso dos dados para a análise de adoção conforme esta política.</p>

      <h2>Com quem compartilhamos</h2>
      <ul>
        <li>Quando você conversa com uma ONG ou faz um pedido, ela vê seu nome, bairro, distância e perfil de moradia.</li>
        <li>Seu <strong>CPF nunca é mostrado</strong>: a ONG vê apenas &quot;CPF verificado&quot;.</li>
        <li>Seu <strong>celular</strong> aparece para a ONG quando você envia um pedido de adoção, para ela poder falar com você.</li>
        <li>O <strong>endereço completo</strong> só é liberado <strong>depois que a ONG aprova</strong> o pedido. Antes disso, ela vê só o bairro e a distância.</li>
        <li>Na <strong>oferta de lar temporário</strong>, ONGs verificadas veem seu nome, bairro, celular e o que você escreveu. Você pode pausar ou apagar quando quiser.</li>
        <li>Fotos de check-in ficam visíveis só para você e a ONG da adoção. Avaliações aparecem na página da ONG sem o seu nome.</li>
        <li>
          <strong>Prestadores de serviço</strong>, só no necessário para o site funcionar: Supabase (banco de dados, login e arquivos, servidores em São Paulo),
          Vercel (hospedagem do site), OpenFreeMap (mapas), BrasilAPI, ViaCEP e OpenStreetMap/Nominatim (consulta do CEP que você digita) e,
          quando ativado, um serviço de envio de e-mail.
        </li>
        <li>Autoridades públicas, quando houver ordem judicial ou obrigação legal.</li>
        <li><strong>Não vendemos nem alugamos seus dados</strong> e não os usamos para publicidade.</li>
      </ul>

      <h2>Transferência para fora do Brasil</h2>
      <p>
        O banco de dados fica no Brasil. Alguns prestadores (como a hospedagem do site e os mapas) podem processar dados técnicos em servidores
        no exterior, com garantias contratuais de proteção compatíveis com a LGPD (art. 33).
      </p>

      <h2>Cookies</h2>
      <p>
        Usamos só cookies essenciais: manter você logado, lembrar o idioma, o local da busca e que você já viu o aviso de cookies.
        Não usamos cookies de propaganda nem ferramentas de rastreamento.
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <ul>
        <li>Enquanto sua conta estiver ativa.</li>
        <li>
          Se você excluir a conta e <strong>nunca adotou</strong> pelo Adotaí, apagamos sua conta e os dados ligados a ela.
          Se <strong>já adotou</strong>, apagamos CPF, celular, endereço, localização, favoritos, buscas salvas e oferta de lar temporário,
          trocamos seu nome por &quot;Conta excluída&quot; e mantemos só o registro da adoção, dos check-ins e das conversas com as ONGs, para o histórico
          delas e a segurança dos animais.
        </li>
        <li>Registros técnicos de acesso ficam pelo prazo dos prestadores de hospedagem e, quando a lei exigir, por 6 meses (Marco Civil da Internet, art. 15).</li>
      </ul>

      <h2>Como protegemos</h2>
      <ul>
        <li>Conexão sempre criptografada (HTTPS) e senhas guardadas cifradas.</li>
        <li>Regras de acesso dentro do próprio banco de dados: cada pessoa e cada ONG só consegue ler o que esta política permite.</li>
        <li>Acesso administrativo restrito à equipe do Adotaí, sem visualização do CPF.</li>
        <li>Se acontecer um incidente de segurança que possa causar risco a você, avisaremos você e a Autoridade Nacional de Proteção de Dados (ANPD).</li>
      </ul>

      <h2>Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode:</p>
      <ul>
        <li>confirmar se tratamos seus dados e acessá-los;</li>
        <li>corrigir dados incompletos ou errados;</li>
        <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
        <li>receber seus dados em formato aberto (portabilidade);</li>
        <li>saber com quem compartilhamos;</li>
        <li>se opor a um tratamento baseado em legítimo interesse;</li>
        <li>excluir sua conta.</li>
      </ul>
      <p className="mt-2">
        Em <a className="font-bold text-brand" href="/perfil">Meu perfil</a> você mesmo corrige dados, <strong>baixa uma cópia</strong> (arquivo JSON) e
        exclui a conta. Para os demais pedidos, escreva para <Email missing="e-mail de contato a definir" />. Respondemos em até 15 dias.
        Você também pode reclamar à ANPD (gov.br/anpd).
      </p>

      <h2>Canal de privacidade</h2>
      <p>
        Como agente de tratamento de pequeno porte (Resolução CD/ANPD nº 2/2022), o Adotaí não indicou um encarregado de dados, mas mantém
        este canal para titulares e para a ANPD: <Email missing="e-mail de contato a definir" />.
      </p>

      <h2>Idade</h2>
      <p>Pedidos de adoção e ofertas de lar temporário são só para maiores de 18 anos. Não coletamos de propósito dados de crianças e adolescentes.</p>

      <h2>Mudanças nesta política</h2>
      <p>Podemos atualizar esta política. A data no topo mostra a versão atual, e mudanças importantes serão avisadas no site.</p>
    </main>
  );
}

function PrivacyEn() {
  return (
    <main lang="en" className={MAIN}>
      <h1 className="text-3xl font-extrabold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm">Last updated: November 19, 2026. Courtesy translation; the Portuguese version prevails.</p>

      <p className="mt-4">
        This policy explains what personal data Adotaí processes, why, who we share it with and how you exercise your rights under Brazil&apos;s
        General Data Protection Law (LGPD, Law 13.709/2018).
      </p>

      <h2>Who is responsible</h2>
      <p>
        Adotaí is operated by <strong>{OPERATOR_NAME || '[name of the person responsible for Adotaí]'}</strong>, the controller of the data processed
        on the platform. Privacy contact: <Email missing="contact email to be defined" />.
      </p>
      <p className="mt-2">Shelters are also controllers of the adopter data they receive to review and follow up on adoptions, and must use it only for that.</p>

      <h2>What data we process</h2>
      <ul>
        <li><strong>Account:</strong> full name, email and password (stored encrypted; no one on the team can see it).</li>
        <li><strong>Adopter profile:</strong> CPF (Brazilian taxpayer ID), phone, postal code, address and line 2, type of home, yard, children and other pets, and what you tell us about your routine.</li>
        <li><strong>Location:</strong> the point of your address (to calculate distance) and the search location (your device&apos;s position, if you tap &quot;Use my location&quot;, or the postal code you type), used only to sort search results and kept in a cookie in your browser for 30 days.</li>
        <li><strong>What you create:</strong> adoption requests and answers to shelter questions, chat messages and photos, check-in answers and photos, reviews, reports, favorites, saved searches and foster offers.</li>
        <li><strong>Shelters:</strong> organization details (name, CNPJ, address, contacts, Pix key) and the team members who use the dashboard.</li>
        <li><strong>Technical data:</strong> IP address, date and time of access and browser type, logged by hosting services for security and operation.</li>
      </ul>
      <p className="mt-2">We do not ask for sensitive data (health, religion, racial origin etc.). Please do not write it in messages or your profile.</p>

      <h2>Why we use it and on what legal basis</h2>
      <ul>
        <li><strong>Creating your account, showing listings, sending requests, chat and post-adoption follow-up</strong> — performance of the service you asked for (LGPD, art. 7, V).</li>
        <li><strong>Checking CPF and phone, preventing fake accounts and scams, protecting animals and moderating reports</strong> — legitimate interest and fraud prevention (art. 7, IX).</li>
        <li><strong>Calculating shelter scores</strong> — legitimate interest, using only aggregated adoption data, without exposing adopters.</li>
        <li><strong>Keeping technical logs and responding to authorities</strong> — legal obligation (art. 7, II), such as Brazil&apos;s Internet Civil Framework.</li>
        <li><strong>Email notices about your requests and conversations</strong> — performance of the service. We do not send advertising.</li>
      </ul>
      <p className="mt-2">When completing your profile, you tick that you agree to the use of your data for adoption review under this policy.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>When you message a shelter or make a request, it sees your name, neighborhood, distance and home profile.</li>
        <li>Your <strong>CPF is never shown</strong>: the shelter only sees &quot;CPF verified&quot;.</li>
        <li>Your <strong>phone number</strong> is shown to the shelter when you send an adoption request, so it can contact you.</li>
        <li>Your <strong>full address</strong> is only released <strong>after the shelter approves</strong> the request. Before that, it only sees your neighborhood and distance.</li>
        <li>In a <strong>foster offer</strong>, verified shelters see your name, neighborhood, phone and what you wrote. You can pause or delete it at any time.</li>
        <li>Check-in photos are visible only to you and the adoption&apos;s shelter. Reviews appear on the shelter page without your name.</li>
        <li>
          <strong>Service providers</strong>, only as needed to run the site: Supabase (database, login and files, servers in São Paulo), Vercel (site hosting),
          OpenFreeMap (maps), BrasilAPI, ViaCEP and OpenStreetMap/Nominatim (lookup of the postal code you type) and, when enabled, an email delivery service.
        </li>
        <li>Public authorities, when there is a court order or legal obligation.</li>
        <li><strong>We do not sell or rent your data</strong> and do not use it for advertising.</li>
      </ul>

      <h2>Transfers outside Brazil</h2>
      <p>The database is in Brazil. Some providers (such as site hosting and maps) may process technical data on servers abroad, with contractual safeguards compatible with the LGPD (art. 33).</p>

      <h2>Cookies</h2>
      <p>We only use essential cookies: keeping you logged in and remembering your language, search location and that you have seen the cookie notice. No advertising cookies or tracking tools.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>While your account is active.</li>
        <li>
          If you delete your account and <strong>never adopted</strong> through Adotaí, we delete the account and its data. If you <strong>have adopted</strong>,
          we delete CPF, phone, address, location, favorites, saved searches and foster offer, replace your name with &quot;Deleted account&quot; and keep only the
          adoption record, check-ins and conversations with shelters, for their history and the animals&apos; safety.
        </li>
        <li>Technical access logs are kept for the hosting providers&apos; period and, when required by law, for 6 months (Internet Civil Framework, art. 15).</li>
      </ul>

      <h2>How we protect it</h2>
      <ul>
        <li>Always-encrypted connection (HTTPS) and encrypted passwords.</li>
        <li>Access rules inside the database itself: each person and shelter can only read what this policy allows.</li>
        <li>Administrative access restricted to the Adotaí team, without viewing CPFs.</li>
        <li>If a security incident may put you at risk, we will notify you and the National Data Protection Authority (ANPD).</li>
      </ul>

      <h2>Your rights</h2>
      <p>Under the LGPD (art. 18), you can:</p>
      <ul>
        <li>confirm whether we process your data and access it;</li>
        <li>correct incomplete or wrong data;</li>
        <li>request anonymization, blocking or deletion of unnecessary data or data processed unlawfully;</li>
        <li>receive your data in an open format (portability);</li>
        <li>know who we share it with;</li>
        <li>object to processing based on legitimate interest;</li>
        <li>delete your account.</li>
      </ul>
      <p className="mt-2">
        In <a className="font-bold text-brand" href="/perfil">My profile</a> you can correct data, <strong>download a copy</strong> (JSON file) and delete your account
        yourself. For other requests, write to <Email missing="contact email to be defined" />. We reply within 15 days. You can also complain to the ANPD (gov.br/anpd).
      </p>

      <h2>Privacy channel</h2>
      <p>
        As a small-sized processing agent (ANPD Resolution 2/2022), Adotaí has not appointed a data protection officer, but keeps this channel for data subjects
        and the ANPD: <Email missing="contact email to be defined" />.
      </p>

      <h2>Age</h2>
      <p>Adoption requests and foster offers are for people 18 and older only. We do not knowingly collect data from children and teenagers.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy. The date at the top shows the current version, and important changes will be announced on the site.</p>
    </main>
  );
}
