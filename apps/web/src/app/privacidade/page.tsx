export const metadata = { title: 'Política de Privacidade' };

// RASCUNHO — precisa de revisão jurídica antes do lançamento.
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
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
        <li>Evitar fraudes e proteger os animais (por isso pedimos CPF e celular verificado).</li>
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
