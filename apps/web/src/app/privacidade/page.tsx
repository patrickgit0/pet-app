import { getI18n, pageTitle } from '@/i18n/server';

export const generateMetadata = pageTitle('Política de Privacidade');

// RASCUNHO — precisa de revisão jurídica antes do lançamento.
export default async function Page() {
  const { lang } = await getI18n();
  if (lang === 'en') return <PrivacyEn />;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="text-3xl font-extrabold text-ink">Política de Privacidade</h1>
      <p className="mt-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">Rascunho em revisão jurídica. Última atualização: novembro de 2026.</p>

      <h2>Quais dados coletamos</h2>
      <ul>
        <li><strong>Para criar a conta:</strong> nome completo, e-mail e senha.</li>
        <li><strong>Para pedir uma adoção:</strong> CPF, celular, CEP, endereço, complemento e informações sobre sua moradia.</li>
        <li><strong>No uso do app:</strong> mensagens trocadas com as ONGs, favoritos, pedidos e respostas dos check-ins pós-adoção.</li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Conectar você às ONGs e permitir a análise responsável dos pedidos de adoção.</li>
        <li>Evitar fraudes e proteger os animais (por isso pedimos CPF e celular).</li>
        <li>Acompanhar o bem-estar do animal depois da adoção.</li>
      </ul>

      <h2>Com quem compartilhamos</h2>
      <ul>
        <li>A ONG vê seu nome, bairro, distância e perfil de moradia quando você conversa ou faz um pedido.</li>
        <li>Seu <strong>CPF nunca é mostrado</strong> à ONG — ela vê apenas &quot;CPF verificado&quot;.</li>
        <li>Celular e endereço completo só são liberados para a ONG <strong>depois que ela aprova</strong> seu pedido.</li>
        <li>Não vendemos seus dados.</li>
      </ul>

      <h2>Por quanto tempo guardamos</h2>
      <p>Enquanto sua conta estiver ativa. Se você excluir a conta, apagamos seus dados. Caso já tenha adotado pelo Adotaí, mantemos somente o registro mínimo da adoção (sem CPF, celular ou endereço) para o histórico da ONG.</p>

      <h2>Seus direitos (LGPD)</h2>
      <p>Você pode acessar, corrigir e excluir seus dados a qualquer momento em <a className="font-bold text-brand" href="/perfil">Meu perfil</a>. Dúvidas: [E-MAIL DO ENCARREGADO DE DADOS].</p>
    </main>
  );
}

function PrivacyEn() {
  return (
    <main lang="en" className="mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="text-3xl font-extrabold text-ink">Privacy Policy</h1>
      <p className="mt-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
        Draft under legal review. Last updated: November 2026. This is a courtesy translation; the Portuguese version prevails.
      </p>

      <h2>What data we collect</h2>
      <ul>
        <li><strong>To create an account:</strong> full name, email and password.</li>
        <li><strong>To request an adoption:</strong> CPF (Brazilian taxpayer ID), mobile phone, postal code (CEP), address, address line 2 and information about your home.</li>
        <li><strong>While using the app:</strong> messages exchanged with shelters, favorites, requests and answers to post-adoption check-ins.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To connect you with shelters and allow a responsible review of adoption requests.</li>
        <li>To prevent fraud and protect the animals (that is why we ask for your CPF and phone number).</li>
        <li>To follow the animal&apos;s well-being after the adoption.</li>
      </ul>

      <h2>Who we share it with</h2>
      <ul>
        <li>The shelter sees your name, neighborhood, distance and home profile when you message them or make a request.</li>
        <li>Your <strong>CPF is never shown</strong> to the shelter — it only sees &quot;CPF verified&quot;.</li>
        <li>Your phone number and full address are only released to the shelter <strong>after it approves</strong> your request.</li>
        <li>We do not sell your data.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>While your account is active. If you delete your account, we erase your data. If you have already adopted through Adotaí, we keep only a minimal record of the adoption (without CPF, phone or address) for the shelter&apos;s history.</p>

      <h2>Your rights (LGPD — Brazilian data protection law)</h2>
      <p>You can access, correct and delete your data at any time in <a className="font-bold text-brand" href="/perfil">My profile</a>. Questions: [DATA PROTECTION OFFICER EMAIL].</p>
    </main>
  );
}
