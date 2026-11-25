<div align="center">

<img src="docs/logo.svg" alt="" width="72" height="72" />

# Vira Lar

**Adoção de cães, gatos e outros animais perto de você — com ONGs verificadas, chat e acompanhamento pós-adoção.**

**No ar:** [viralarpet.vercel.app](https://viralarpet.vercel.app) (dados de demonstração)

Marketplace no estilo classificados: ONGs anunciam, adotantes buscam por distância e pela qualidade da ONG,
conversam pelo chat e a plataforma acompanha o animal depois da adoção.

![Status](https://img.shields.io/badge/status-MVP%20em%20desenvolvimento-E8833A)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20PostGIS-3ECF8E?logo=supabase)
![Piloto](https://img.shields.io/badge/piloto-Franca%2FSP-0F6E5C)

</div>

<p align="center">
  <img src="docs/screenshots/busca-web.png" alt="Busca de animais com filtros, lista e mapa" width="900" />
</p>

## Por que o Vira Lar

Hoje a adoção acontece espalhada entre Instagram, grupos de WhatsApp e planilhas. Isso funciona para
divulgar, mas falha em duas coisas: **ajudar o adotante a escolher com calma** e **acompanhar o animal
depois que ele vai para casa** — que é onde acontecem as devoluções.

O Vira Lar junta três coisas que hoje ficam separadas:

| | |
| --- | --- |
| 🔎 **Vitrine com busca por distância** | Lista + mapa + filtros (espécie, porte, idade, castração, convivência com crianças/cães/gatos, apartamento). |
| ⭐ **Reputação medida das ONGs** | Nota de 0 a 5 calculada com dados reais da plataforma, não só estrelas. |
| 🤝 **Pós-adoção estruturado** | Termo aceito digitalmente, check-ins com foto (7, 30, 90 e 180 dias), alerta para a ONG, avaliação e registro de devolução. |
| 📣 **Divulgação pronta** | Link bonito por animal, prévia com foto no WhatsApp, posts prontos para o Instagram, páginas para o Google. |
| 🏠 **Comunidade** | Feiras de adoção, cadastro de lar temporário e doação por Pix direto para a ONG (QR Code gerado no site). |
| 📘 **Pronto para as ONGs** | [Guia passo a passo](https://viralarpet.vercel.app/guia-ong) para quem vai começar a anunciar. |

## Telas

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/animal-web.png" alt="Página do animal" /><br/><sub><b>Página do animal</b> — saúde, convivência, ONG com nota e tempo de resposta.</sub></td>
    <td width="50%"><img src="docs/screenshots/completar-perfil.png" alt="Completar perfil" /><br/><sub><b>Completar perfil</b> — CPF, celular e CEP que preenche cidade e bairro.</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/painel-ong.png" alt="Painel da ONG" /><br/><sub><b>Painel da ONG</b> — indicadores, candidatos e alertas de pós-adoção.</sub></td>
    <td><img src="docs/screenshots/ong-web.png" alt="Página pública da ONG" /><br/><sub><b>Página pública da ONG</b> — nota, adoções, animais e chave Pix para doações.</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/mensagens.png" alt="Mensagens" /><br/><sub><b>Chat</b> — sempre ligado a um animal, em tempo real.</sub></td>
    <td><img src="docs/screenshots/pos-adocao.png" alt="Pós-adoção" /><br/><sub><b>Pós-adoção</b> — check-ins de cada adoção e acompanhamento da ONG.</sub></td>
  </tr>
</table>

<p align="center">
  <img src="docs/screenshots/busca-mobile.png" alt="Site no celular" width="240" />
  <br/><sub>O site é responsivo e instalável (PWA) no celular.</sub>
</p>

## Como funciona

```mermaid
flowchart LR
  A[Adotante cria conta<br/><sub>nome, e-mail, senha</sub>] --> B[Busca por distância<br/>e nota da ONG]
  B --> C{Conversar ou<br/>Quero adotar?}
  C -- Conversar --> D[Chat com a ONG]
  C -- Quero adotar --> E{Perfil completo?}
  E -- não --> F[Completar perfil<br/><sub>CPF, celular, CEP + endereço</sub>]
  F --> C
  E -- sim --> G[Pedido enviado<br/><sub>compromisso de guarda responsável<br/>+ perguntas da ONG</sub>]
  G --> H[ONG analisa<br/><sub>vê bairro, moradia, celular e<br/>'CPF válido'</sub>]
  H -- aprova --> I[ONG recebe<br/>o endereço]
  I --> J[Adoção confirmada<br/><sub>termo aceito no site</sub>]
  J --> K[Check-ins 7 / 30 / 90 / 180 dias<br/><sub>com foto</sub>]
  K --> L[Avaliação e nota da ONG]
```

### Regras de privacidade (LGPD)

- **Cadastro em duas etapas:** para olhar, favoritar e conversar basta nome, e-mail e senha. CPF, celular e endereço só são pedidos ao clicar em **"Quero adotar"**.
- **A ONG nunca vê o CPF** — apenas "CPF válido" (o sistema confere os dígitos; não consulta a Receita).
- O **celular** aparece para a ONG já no pedido; o **endereço completo** só depois que ela **aprova**.
- **Baixar meus dados** (JSON) e **excluir a conta** a qualquer momento, no perfil.
- Localização dos animais no mapa é **arredondada (~1 km)**; distâncias abaixo de 1 km aparecem como "menos de 1 km".
- Exclusão de conta com anonimização quando já houve adoção. Só cookies essenciais (sem rastreamento).
- Textos completos no site: [Política de Privacidade](https://viralarpet.vercel.app/privacidade) (bases legais, prestadores, direitos, canal de privacidade),
  [Termos de uso](https://viralarpet.vercel.app/termos) e [Termo de adoção](https://viralarpet.vercel.app/termo-de-adocao) versionado —
  cada adotante vê sempre a versão que aceitou.

Essas regras ficam **no banco** (Row Level Security + funções SQL), não só na interface.

### Nota da ONG

| Critério | Peso | Como mede |
| --- | --- | --- |
| Sucesso das adoções | 30% | % sem devolução após 90 dias |
| Pós-adoção cumprido | 20% | % de check-ins respondidos |
| Avaliação de adotantes | 20% | Estrelas, só de quem adotou pela plataforma |
| Tempo de resposta | 15% | Mediana da 1ª resposta no chat |
| Transparência | 15% | Anúncios com saúde e descrição completas e atualizados |

ONGs com menos de 5 adoções aparecem como **"Nova na plataforma"**. A ordenação "Recomendado" combina 60% proximidade e 40% nota.

## Arquitetura

```mermaid
flowchart TB
  subgraph Clientes
    W[Web — Next.js 15<br/><sub>busca, animal, ONG, painel, admin</sub>]
  end
  subgraph Supabase
    PG[(Postgres + PostGIS<br/><sub>RLS + funções de negócio</sub>)]
    AU[Auth<br/><sub>e-mail/senha com link de confirmação</sub>]
    RT[Realtime<br/><sub>chat</sub>]
    ST[Storage<br/><sub>fotos</sub>]
  end
  W --> AU & PG & RT & ST
  W -. CEP .-> BR[BrasilAPI / ViaCEP / Nominatim]
  W -. mapa .-> OFM[OpenFreeMap + MapLibre]
```

Tudo gratuito no início: mapas com **OpenFreeMap/OpenStreetMap** (sem chave), CEP com **BrasilAPI/ViaCEP**, backend no plano free do Supabase.

```
app-pet/
├── apps/
│   └── web/          Next.js — site público, área do adotante, painel da ONG e admin
├── packages/
│   └── shared/       Tipos do banco, validação de CPF/CNPJ, máscaras, CEP, rótulos pt-BR
├── supabase/
│   ├── migrations/   Schema, RLS, funções (busca por raio, pedidos, ranking), storage
│   └── seed.sql      Dados fictícios de Franca
├── e2e/              Testes de ponta a ponta (Playwright)
├── scripts/          Capturas de tela e verificador de traduções
└── .github/          CI (tipos, lint, testes, traduções, build e E2E)
```

## Rodando localmente

Pré-requisitos: **Node 20+**, **Docker** (para o Supabase local).

```bash
npm install                 # instala web + shared + CLI do Supabase
npx supabase start          # sobe Postgres, Auth, Realtime e Storage no Docker (aplica migrations e seed)
npx supabase status -o env  # copie API_URL e ANON_KEY
cp apps/web/.env.example apps/web/.env.local   # e cole os valores (nome do responsável e e-mail de contato são opcionais no dev)
npm run dev:web             # http://localhost:3000
```

**Usuários de teste** (senha `adotai123`):

| E-mail | Papel |
| --- | --- |
| `adotante@adotai.dev` | Adotante com perfil completo |
| `novo@adotai.dev` | Adotante só com a etapa 1 (para testar "Completar perfil") |
| `ong1@adotai.dev` | Patas Unidas (verificada, nota 5,0) |
| `ong2@adotai.dev` / `ong3@adotai.dev` | Lar do Focinho / Abrigo Esperança |
| `admin@adotai.dev` | Administração |

O celular não é verificado por SMS (decisão do produto): só o formato é validado (DDD + 9 dígitos).

Outros comandos:

```bash
npm test                 # testes do pacote compartilhado (CPF, CNPJ, CEP, máscaras, compatibilidade)
npm run lint:web
python scripts/i18n-check.py   # todo texto da web precisa ter inglês (o CI falha se faltar)
npx playwright test      # testes de ponta a ponta (site rodando em :3000 contra o banco local)
npm run build:web
npm run db:reset         # recria o banco local com migrations + seed
npm run db:types         # regenera os tipos TypeScript a partir do banco
node scripts/screenshots.mjs <id-de-um-animal>   # atualiza as imagens deste README
```

## Roadmap

- [x] Plano, protótipo e decisões de produto
- [x] Banco: schema, RLS, busca por raio, pedidos, chat, pós-adoção, ranking
- [x] Web: busca com mapa, animal, ONG, cadastro em 2 etapas, chat em tempo real, painel da ONG, admin
- [x] Projeto Supabase em produção + deploy da web (Vercel)
- [x] Avisos no site, recuperar senha, tarefas agendadas (`pg_cron`), travas de segurança no banco
- [x] Pós-adoção completo: termo digital, check-ins com foto, avaliação, devolução
- [x] Denunciar e bloquear; linha do tempo do pedido; histórico e fichas no admin; exportar CSV
- [x] Divulgação: link bonito, prévia com foto, kit de posts, SEO local (sitemap, páginas por cidade)
- [x] Compatibilidade com a casa do adotante, perguntas da ONG, feiras, lar temporário, doação por Pix
- [x] LGPD: Política de Privacidade, Termos de uso e Termo de adoção v2 completos; baixar meus dados; aviso de cookies
- [x] Guia para ONGs; página inexistente responde 404 de verdade
- [x] CI no GitHub + testes de ponta a ponta; site instalável (PWA)
- [ ] E-mails transacionais (precisa de domínio + Resend)
- [ ] Moderação no admin (esconder avaliação, agir direto na denúncia)
- [ ] Sustentabilidade: página de impacto, parceiros locais com kit de boas-vindas pós-adoção, "Apoie o Vira Lar"
- [ ] Buscas salvas com alerta, equipe da ONG com papéis, estatísticas por animal

## Aviso

Todos os nomes de ONGs, animais e pessoas nos dados de exemplo e nas imagens são **fictícios**.
A Política de Privacidade, os Termos de uso e o Termo de Adoção foram escritos com base na LGPD, no Marco Civil da Internet e na legislação de proteção animal, **sem revisão de advogado**. Revise antes de reutilizá-los em outro projeto.
