import { type NextRequest } from 'next/server';
import { makeT } from '@/i18n';
import { notificationText } from '@/lib/notifications';

/**
 * Recebe um aviso do banco (pg_net, ver migration 11) e envia por e-mail via Resend.
 * Desligado enquanto NOTIFY_SECRET, RESEND_API_KEY e EMAIL_FROM não estiverem configurados na Vercel.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.NOTIFY_SECRET, key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!secret || req.headers.get('x-notify-secret') !== secret) return new Response('forbidden', { status: 403 });
  if (!key || !from) return new Response('email desligado', { status: 503 });

  const n = (await req.json()) as { kind: string; data: unknown; link: string; email: string; name?: string };
  if (!n.email || !n.link?.startsWith('/')) return new Response('invalid', { status: 400 });
  const t = makeT('pt');
  const text = notificationText(t, n.kind, n.data);
  const url = `${req.nextUrl.origin}${n.link}`;
  const first = (n.name ?? '').split(' ')[0];
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:28px 22px;color:#1B1F1D">
  <p style="font-size:22px;font-weight:800;color:#0F6E5C;margin:0 0 20px">Adotaí</p>
  ${first ? `<p style="font-size:15px;margin:0 0 8px">Olá, ${esc(first)}!</p>` : ''}
  <p style="font-size:17px;font-weight:700;line-height:1.4;margin:0 0 20px">${esc(text)}</p>
  <a href="${esc(url)}" style="display:inline-block;background:#0F6E5C;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px">Abrir no Adotaí</a>
  <p style="font-size:12px;color:#5B635F;margin:28px 0 0">Você recebe este e-mail porque tem uma conta no Adotaí.</p>
</div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: n.email, subject: text.slice(0, 120), html, text: `${text}\n\n${url}` }),
  });
  return new Response(r.ok ? 'ok' : 'falhou', { status: r.ok ? 200 : 502 });
}
