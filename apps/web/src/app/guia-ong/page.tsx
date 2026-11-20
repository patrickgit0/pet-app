import Link from 'next/link';
import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';

// Guia de boas-vindas para mandar às ONGs convidadas. Texto em PT e EN aqui mesmo (página longa, fora do en.ts).
// i18n-check: ignore-file

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getI18n();
  return lang === 'en'
    ? { title: 'Guide for NGOs', description: 'How to use Adotaí step by step: listings, requests, chat, adoption and follow-up.' }
    : { title: 'Guia para ONGs', description: 'Como usar o Adotaí passo a passo: anúncios, pedidos, conversa, adoção e acompanhamento.' };
}

type Step = { title: string; where?: { href: string; label: string }; items: string[] };
type Content = {
  title: string; intro: string; free: string; start: string; panel: string; stepsTitle: string; steps: Step[];
  privacyTitle: string; privacy: string[]; rankTitle: string; rankIntro: string; rank: [string, string][]; rankNew: string;
  tipsTitle: string; tips: string[]; faqTitle: string; faq: [string, string][]; help: string;
};

const PT: Content = {
  title: 'Guia para ONGs',
  intro: 'Tudo o que sua ONG precisa saber para anunciar, escolher adotantes e acompanhar cada adoção no Adotaí.',
  free: 'Gratuito para ONGs e adotantes. Leva uns 15 minutos para deixar tudo pronto.',
  start: 'Cadastrar minha ONG',
  panel: 'Ir para o painel',
  stepsTitle: 'Passo a passo',
  steps: [
    {
      title: 'Crie a conta e cadastre a ONG',
      where: { href: '/sou-ong', label: 'Sou ONG' },
      items: [
        'Crie a conta da pessoa responsável e preencha os dados da ONG (nome, CNPJ, endereço).',
        'A equipe do Adotaí confere o cadastro. Enquanto isso, você já pode cadastrar animais.',
        'Depois da aprovação, a ONG ganha o selo "ONG verificada" e os anúncios aparecem na busca.',
      ],
    },
    {
      title: 'Complete a página da ONG',
      where: { href: '/painel/ong', label: 'Painel → Dados da ONG' },
      items: [
        'Apresentação, horário de atendimento, WhatsApp e Instagram.',
        'Chave Pix (opcional): o site gera o QR Code e as doações vão direto para a ONG, sem intermediário.',
        'Até 5 perguntas que o adotante responde ao pedir a adoção (ex.: "Quem cuida do animal nas férias?").',
        'A visão geral do painel mostra um checklist do que falta.',
      ],
    },
    {
      title: 'Cadastre os animais',
      where: { href: '/painel/animais/novo', label: 'Painel → Animais → Novo' },
      items: [
        'Fotos, idade aproximada, porte, saúde (vacinas, castração, vermífugo), temperamento e com quem convive bem.',
        'Foto da carteirinha de vacinação (opcional) aparece no anúncio e passa confiança.',
        'Salve como rascunho ou publique. Para animais parecidos (ninhada), use "Duplicar".',
        'Em cada animal, "Divulgar" gera imagens prontas para o feed e os stories do Instagram, com legenda.',
      ],
    },
    {
      title: 'Receba e analise os pedidos',
      where: { href: '/painel/pedidos', label: 'Painel → Candidatos' },
      items: [
        'Só pede adoção quem completou o perfil: CPF válido, celular, endereço e como é a casa.',
        'Você vê nome, bairro, distância, moradia, celular, "CPF verificado" e as respostas às suas perguntas.',
        'A aba "Esperando resposta" mostra quem aguarda vocês, do mais antigo para o mais novo.',
        'Mude a etapa do pedido (em análise, visita) para o adotante acompanhar.',
      ],
    },
    {
      title: 'Converse e marque a visita',
      where: { href: '/mensagens', label: 'Mensagens' },
      items: [
        'Toda conversa é sobre um animal e começa pelo adotante: a ONG não recebe mensagem de quem não demonstrou interesse.',
        'No chat dá para enviar fotos, usar respostas rápidas e propor dia e horário de visita.',
        'Se precisar, é possível bloquear a conversa ou denunciar.',
      ],
    },
    {
      title: 'Aprove e confirme a adoção',
      items: [
        'Ao aprovar, a ONG passa a ver o endereço completo do adotante. Recusar não exige motivo.',
        'Na entrega, confirme a adoção no pedido. O adotante aceita o termo de adoção padrão pelo site e os dois podem baixar uma cópia em PDF.',
        'O anúncio sai da busca e o animal entra em "Finais felizes" na página da ONG (sem dados do adotante).',
      ],
    },
    {
      title: 'Acompanhe depois da adoção',
      where: { href: '/painel/pos-adocao', label: 'Painel → Pós-adoção' },
      items: [
        'O Adotaí pede notícias ao adotante com 7, 30, 90 e 180 dias, com fotos. Vocês veem as respostas no painel.',
        'O filtro "Precisam de atenção" mostra check-ins atrasados e quem marcou "estou com dificuldade".',
        'Se o animal voltar, use "Registrar devolução": o anúncio volta como rascunho ou direto para a busca.',
        'Depois de 30 dias, o adotante pode avaliar a ONG (uma avaliação por adoção).',
      ],
    },
    {
      title: 'Extras',
      items: [
        'Feiras de adoção: cadastre em Painel → Feiras e elas aparecem em /feiras, na sua página e na busca.',
        'Lar temporário: ONGs verificadas veem as pessoas da região que se ofereceram para cuidar de um animal por um tempo, com contato por WhatsApp.',
      ],
    },
  ],
  privacyTitle: 'O que a ONG vê do adotante',
  privacy: [
    'Nunca o número do CPF, só "CPF verificado".',
    'O celular já no pedido.',
    'O endereço completo só depois de aprovar o pedido. Antes disso, só bairro e distância.',
    'Use os dados apenas para avaliar e acompanhar a adoção (LGPD).',
  ],
  rankTitle: 'Como a nota da ONG é calculada',
  rankIntro: 'A nota (0 a 5) é calculada pela plataforma com base em resultados, não em popularidade:',
  rank: [
    ['30%', 'adoções que continuam bem depois de 90 dias'],
    ['20%', 'acompanhamento pós-adoção feito'],
    ['20%', 'avaliações de quem adotou pelo Adotaí'],
    ['15%', 'tempo de resposta aos pedidos e mensagens'],
    ['15%', 'transparência: anúncios com saúde e descrição preenchidas e atualizados nos últimos 60 dias'],
  ],
  rankNew: 'Com menos de 5 adoções concluídas, a ONG aparece como "Nova na plataforma".',
  tipsTitle: 'Dicas que fazem diferença',
  tips: [
    'Fotos com luz natural, na altura do animal, mostrando o rosto. A primeira foto é a capa.',
    'Conte a personalidade: como reage a crianças, outros animais, se gosta de colo, se fica bem sozinho.',
    'Responda os pedidos em até 24 horas. Quem espera muito desiste, e o tempo de resposta entra na nota.',
    'Adultos e idosos esperam mais. O anúncio mostra "Esperando há X meses" depois de 60 dias e a busca tem a ordem "Esperando há mais tempo".',
    'Compartilhe o link do anúncio: a prévia com foto aparece sozinha no WhatsApp e nas redes.',
  ],
  faqTitle: 'Perguntas frequentes',
  faq: [
    ['Quanto custa?', 'Nada. O Adotaí é gratuito para ONGs e adotantes.'],
    ['Precisa de CNPJ?', 'Por enquanto, sim. Protetores independentes devem entrar numa próxima etapa.'],
    ['Posso usar o meu próprio termo de adoção?', 'Ainda não: todas as adoções usam o termo padrão da plataforma, que você pode ler em /termo-de-adocao.'],
    ['Posso cobrar taxa de adoção?', 'Pode, desde que esteja escrita na descrição do anúncio antes do pedido. É proibido vender animais.'],
    ['Quem decide a adoção?', 'Sempre a ONG. O Adotaí só aproxima e organiza o processo.'],
  ],
  help: 'Dúvidas ou problemas? Fale com a equipe do Adotaí pelo contato que enviou este guia.',
};

const EN: Content = {
  title: 'Guide for NGOs',
  intro: 'Everything your NGO needs to know to list animals, choose adopters and follow up on each adoption on Adotaí.',
  free: 'Free for NGOs and adopters. It takes about 15 minutes to get set up.',
  start: 'Register my NGO',
  panel: 'Go to the dashboard',
  stepsTitle: 'Step by step',
  steps: [
    {
      title: 'Create the account and register the NGO',
      where: { href: '/sou-ong', label: 'For NGOs' },
      items: [
        'Create the account of the person in charge and fill in the NGO details (name, CNPJ, address).',
        'The Adotaí team reviews the registration. Meanwhile, you can already add animals.',
        'Once approved, the NGO gets the "Verified NGO" badge and its listings appear in search.',
      ],
    },
    {
      title: 'Complete the NGO page',
      where: { href: '/painel/ong', label: 'Dashboard → NGO details' },
      items: [
        'About text, opening hours, WhatsApp and Instagram.',
        'Pix key (optional): the site generates the QR code and donations go straight to the NGO, with no middleman.',
        'Up to 5 questions the adopter answers when requesting an adoption (e.g. "Who looks after the pet on holidays?").',
        'The dashboard overview shows a checklist of what is missing.',
      ],
    },
    {
      title: 'Add the animals',
      where: { href: '/painel/animais/novo', label: 'Dashboard → Animals → New' },
      items: [
        'Photos, approximate age, size, health (vaccines, neutering, deworming), temperament and who they get along with.',
        'A photo of the vaccination card (optional) shows on the listing and builds trust.',
        'Save as draft or publish. For similar animals (a litter), use "Duplicate".',
        'On each animal, "Promote" creates ready-made images for Instagram feed and stories, with a caption.',
      ],
    },
    {
      title: 'Receive and review requests',
      where: { href: '/painel/pedidos', label: 'Dashboard → Applicants' },
      items: [
        'Only people with a complete profile can request: valid CPF, phone, address and home details.',
        'You see name, neighborhood, distance, home, phone, "CPF verified" and the answers to your questions.',
        'The "Awaiting reply" tab shows who is waiting for you, oldest first.',
        'Move the request stage (reviewing, visit) so the adopter can follow along.',
      ],
    },
    {
      title: 'Chat and schedule the visit',
      where: { href: '/mensagens', label: 'Messages' },
      items: [
        'Every conversation is about one animal and is started by the adopter: the NGO never gets messages from people who showed no interest.',
        'In the chat you can send photos, use quick replies and propose a visit date and time.',
        'If needed, you can block the conversation or report it.',
      ],
    },
    {
      title: 'Approve and confirm the adoption',
      items: [
        'Once approved, the NGO can see the adopter\'s full address. Rejecting needs no reason.',
        'On hand-over, confirm the adoption on the request. The adopter accepts the standard adoption agreement online and both can download a PDF copy.',
        'The listing leaves search and the animal joins "Happy endings" on the NGO page (no adopter data).',
      ],
    },
    {
      title: 'Follow up after the adoption',
      where: { href: '/painel/pos-adocao', label: 'Dashboard → After adoption' },
      items: [
        'Adotaí asks the adopter for news at 7, 30, 90 and 180 days, with photos. You see the answers on the dashboard.',
        'The "Need attention" filter shows late check-ins and adopters who reported difficulties.',
        'If the animal comes back, use "Register return": the listing goes back to draft or straight to search.',
        'After 30 days, the adopter can review the NGO (one review per adoption).',
      ],
    },
    {
      title: 'Extras',
      items: [
        'Adoption fairs: add them in Dashboard → Fairs and they show on /feiras, your page and search.',
        'Foster homes: verified NGOs see people nearby who offered to care for an animal for a while, with WhatsApp contact.',
      ],
    },
  ],
  privacyTitle: 'What the NGO sees about the adopter',
  privacy: [
    'Never the CPF number, only "CPF verified".',
    'The phone number, from the request on.',
    'The full address only after approving the request. Before that, only neighborhood and distance.',
    'Use the data only to evaluate and follow up on the adoption (LGPD).',
  ],
  rankTitle: 'How the NGO score works',
  rankIntro: 'The score (0 to 5) is calculated by the platform based on results, not popularity:',
  rank: [
    ['30%', 'adoptions still going well after 90 days'],
    ['20%', 'post-adoption follow-up done'],
    ['20%', 'reviews from people who adopted through Adotaí'],
    ['15%', 'response time to requests and messages'],
    ['15%', 'transparency: listings with health and description filled in and updated in the last 60 days'],
  ],
  rankNew: 'With fewer than 5 completed adoptions, the NGO shows as "New on the platform".',
  tipsTitle: 'Tips that make a difference',
  tips: [
    'Photos in natural light, at the animal\'s eye level, showing the face. The first photo is the cover.',
    'Describe the personality: with children, other animals, whether they like cuddles or are fine alone.',
    'Reply to requests within 24 hours. People who wait too long give up, and response time counts toward the score.',
    'Adults and seniors wait longer. Listings show "Waiting for X months" after 60 days and search can sort by "Waiting longest".',
    'Share the listing link: the photo preview shows up automatically on WhatsApp and social media.',
  ],
  faqTitle: 'FAQ',
  faq: [
    ['How much does it cost?', 'Nothing. Adotaí is free for NGOs and adopters.'],
    ['Is a CNPJ required?', 'For now, yes. Independent rescuers should come in a later stage.'],
    ['Can I use my own adoption agreement?', 'Not yet: all adoptions use the platform\'s standard agreement, available at /termo-de-adocao.'],
    ['Can I charge an adoption fee?', 'Yes, as long as it is written in the listing description before the request. Selling animals is forbidden.'],
    ['Who decides the adoption?', 'Always the NGO. Adotaí only brings people together and organizes the process.'],
  ],
  help: 'Questions or problems? Contact the Adotaí team through whoever sent you this guide.',
};

export default async function Page() {
  const { lang } = await getI18n();
  const c = lang === 'en' ? EN : PT;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 leading-relaxed text-ink-2 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-extrabold text-ink">{c.title}</h1>
      <p className="mt-2 text-lg">{c.intro}</p>
      <p className="mt-2 text-sm">{c.free}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/sou-ong" className="btn-primary">{c.start}</Link>
        <Link href="/painel" className="btn-ghost bg-white">{c.panel}</Link>
      </div>

      <h2 className="mt-10 mb-3 text-xl font-extrabold text-ink">{c.stepsTitle}</h2>
      <ol className="space-y-3">
        {c.steps.map((s, i) => (
          <li key={s.title} className="card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <div className="min-w-0">
                <h3 className="font-extrabold text-ink">{s.title}</h3>
                {s.where && <Link href={s.where.href} className="text-sm font-semibold text-brand">{s.where.label}</Link>}
                <ul className="mt-2 space-y-1">
                  {s.items.map((it) => <li key={it} className="ml-5 list-disc">{it}</li>)}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="card mt-8 p-4 sm:p-5">
        <h2 className="mb-2 text-lg font-extrabold text-ink">{c.privacyTitle}</h2>
        <ul className="space-y-1">{c.privacy.map((p) => <li key={p} className="ml-5 list-disc">{p}</li>)}</ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-extrabold text-ink">{c.rankTitle}</h2>
        <p>{c.rankIntro}</p>
        <ul className="mt-2 space-y-1">
          {c.rank.map(([w, d]) => <li key={d} className="flex gap-3"><span className="w-10 shrink-0 font-bold text-ink">{w}</span><span>{d}</span></li>)}
        </ul>
        <p className="mt-2 text-sm">{c.rankNew}</p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-extrabold text-ink">{c.tipsTitle}</h2>
        <ul className="space-y-1">{c.tips.map((p) => <li key={p} className="ml-5 list-disc">{p}</li>)}</ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-extrabold text-ink">{c.faqTitle}</h2>
        <div className="space-y-2">
          {c.faq.map(([q, a]) => (
            <details key={q} className="card p-4">
              <summary className="cursor-pointer font-bold text-ink">{q}</summary>
              <p className="mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-8 text-sm">{c.help}</p>
    </main>
  );
}
