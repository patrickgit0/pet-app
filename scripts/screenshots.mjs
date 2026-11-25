// Gera as capturas de tela do README (docs/screenshots) a partir do ambiente LOCAL.
// Pré-requisitos: `npm run db:start` (com seed) e o site rodando em http://localhost:3000.
// Uso: node scripts/screenshots.mjs
// Faz login com os usuários fictícios do seed via Supabase Auth e controla o Chrome pelo DevTools Protocol.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SITE = process.env.SITE_URL ?? 'http://localhost:3000';
const env = Object.fromEntries(
  readFileSync(resolve('apps/web/.env.local'), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OUT = resolve('docs/screenshots');
mkdirSync(OUT, { recursive: true });

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => existsSync(p));

async function login(email) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'adotai123' }),
  });
  if (!r.ok) throw new Error(`login ${email}: ${r.status}`);
  return r.json();
}

// Cookie no formato do @supabase/ssr: sb-<ref>-auth-token = "base64-" + base64url(JSON da sessão)
function sessionCookies(session) {
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0];
  const name = `sb-${ref}-auth-token`;
  const value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
  const chunks = value.match(/.{1,3180}/g);
  return chunks.length === 1 ? [{ name, value }] : chunks.map((v, i) => ({ name: `${name}.${i}`, value: v }));
}

async function main() {
  const port = 9333;
  const chrome = spawn(CHROME, [
    '--headless=new', '--hide-scrollbars', '--no-first-run', `--remote-debugging-port=${port}`,
    `--user-data-dir=${join(tmpdir(), 'viralar-shots')}`, '--enable-unsafe-swiftshader', 'about:blank',
  ], { stdio: 'ignore' });
  let wsUrl;
  for (let i = 0; i < 50 && !wsUrl; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch {}
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  await send('Page.enable');
  await send('Network.enable');

  async function shot(name, path, { w = 1440, h = 1000, mobile = false, as } = {}) {
    await send('Network.clearBrowserCookies');
    if (as) {
      const session = await login(as);
      for (const c of sessionCookies(session)) {
        await send('Network.setCookie', { name: c.name, value: c.value, url: SITE, path: '/' });
      }
    }
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await send('Page.navigate', { url: SITE + path });
    await wait(4500);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
    console.log('ok', name);
  }

  const pipoca = process.argv[2];
  await shot('busca-web', '/', { h: 1100 });
  if (pipoca) await shot('animal-web', `/animais/${pipoca}`);
  await shot('ong-web', '/ongs/patas-unidas');
  await shot('busca-mobile', '/', { w: 390, h: 844, mobile: true });
  await shot('criar-conta', '/criar-conta', { h: 900 });
  await shot('completar-perfil', '/perfil/completar', { as: 'novo@adotai.dev', h: 1150 });
  await shot('painel-ong', '/painel', { as: 'ong1@adotai.dev' });
  await shot('candidato', '/painel/pedidos', { as: 'ong1@adotai.dev', h: 700 });
  await shot('mensagens', '/mensagens', { as: 'adotante@adotai.dev', h: 700 });
  await shot('pos-adocao', '/painel/pos-adocao', { as: 'ong1@adotai.dev' });

  ws.close();
  chrome.kill();
}

main().catch((e) => { console.error(e); process.exit(1); });
