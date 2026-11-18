import { revalidatePath } from 'next/cache';
import { createClient, getSession } from '@/lib/supabase/server';
import { getI18n, pageTitle } from '@/i18n/server';
import { notificationText } from '@/lib/notifications';
import { CalendarIcon, ChatIcon, CheckIcon, HeartIcon, PawIcon } from '@/components/icons';

export const generateMetadata = pageTitle('Avisos');

async function markAllRead() {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  revalidatePath('/', 'layout');
}

/** Abrir um aviso marca como lido e leva ao destino. */
async function openNotification(id: string, link: string) {
  'use server';
  const supabase = await createClient();
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/', 'layout');
  const { redirect } = await import('next/navigation');
  redirect(link.startsWith('/') ? link : '/');
}

const ICON: Record<string, (p: { size?: number; className?: string }) => React.ReactNode> = {
  request_new: PawIcon, request_status: CheckIcon, message: ChatIcon, visit: CalendarIcon, adoption: HeartIcon, checkin: PawIcon,
};

export default async function Page() {
  const { supabase, user } = await getSession();
  const { t, locale } = await getI18n();
  const { data: items } = await supabase.from('notifications').select('id, kind, data, link, created_at, read_at')
    .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(60);
  const unread = (items ?? []).filter((n) => !n.read_at).length;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t('Avisos')}</h1>
        {unread > 0 && (
          <form action={markAllRead}><button className="text-sm font-semibold text-brand">{t('Marcar todos como lidos')}</button></form>
        )}
      </div>
      <ul className="card divide-y divide-line">
        {(items ?? []).map((n) => (
          <li key={n.id}>
            <form action={openNotification.bind(null, n.id, n.link)}>
              <button className={`flex w-full items-start gap-3 p-4 text-left hover:bg-ground ${n.read_at ? '' : 'bg-brand-soft/40'}`}>
                <span aria-hidden className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">{(ICON[n.kind] ?? PawIcon)({ size: 16 })}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={`text-sm ${n.read_at ? '' : 'font-bold'}`}>{notificationText(t, n.kind, n.data)}</span>
                  <span className="text-xs text-muted">{new Date(n.created_at).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</span>
                </span>
                {!n.read_at && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label={t('Não lida')} />}
              </button>
            </form>
          </li>
        ))}
        {!items?.length && <li className="p-8 text-center text-sm text-muted">{t('Nenhum aviso por enquanto. Avisamos aqui quando chegar mensagem, pedido ou novidade.')}</li>}
      </ul>
    </main>
  );
}
