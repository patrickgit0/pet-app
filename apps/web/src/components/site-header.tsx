import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { PawIcon, UserIcon } from './icons';
import { initials } from '@/lib/utils';
import { myConversationsFilter } from '@/lib/conversations';

export async function SiteHeader() {
  const { user, profile, supabase } = await getSession();
  const { t } = await getI18n();

  let unread = 0;
  if (user) {
    // Só conversas em que a pessoa participa (o admin enxerga todas pelo RLS)
    const { filter } = await myConversationsFilter(supabase, user.id);
    const { data: convs } = await supabase.from('conversations').select('id').or(filter);
    const ids = (convs ?? []).map((c) => c.id);
    if (ids.length) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .is('read_at', null)
        .neq('sender_id', user.id);
      unread = count ?? 0;
    }
  }
  const isNgo = profile?.role === 'ngo_member';
  const isAdmin = profile?.role === 'admin';

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-7 gap-y-1 px-4 pt-3 sm:px-6 lg:flex-nowrap lg:py-3.5">
        <Link href="/" className="flex items-center gap-2 text-[22px] font-extrabold text-brand">
          <PawIcon size={28} />
          Adotaí
        </Link>
        <nav className="order-last -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-2 text-sm font-semibold whitespace-nowrap [scrollbar-width:none] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-4 lg:order-none lg:mx-0 lg:w-auto lg:flex-1 lg:gap-5 lg:px-0 [&>a]:px-2 [&>a]:py-3 lg:[&>a]:p-0">
          <Link href="/">{t('Adotar')}</Link>
          <Link href="/ongs">{t('ONGs')}</Link>
          {user && (
            <Link href="/mensagens" className="inline-flex items-center">
              {t('Mensagens')}
              {unread > 0 && (
                <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-accent px-1.5 text-[11px] leading-5 font-extrabold text-ink" aria-label={t('{n} não lidas', { n: unread })}>
                  {unread}
                </span>
              )}
            </Link>
          )}
          {user && !isNgo && <Link href="/meus-pedidos">{t('Meus pedidos')}</Link>}
          {user && !isNgo && <Link href="/favoritos">{t('Favoritos')}</Link>}
          {isNgo && <Link href="/painel">{t('Painel da ONG')}</Link>}
          {isAdmin && <Link href="/admin">Admin</Link>}
          {!user && <Link href="/sou-ong">{t('Sou ONG')}</Link>}
        </nav>
        {user ? (
          <Link href="/perfil" aria-label={t('Meu perfil')} title={t('Meu perfil')} className="flex items-center gap-2 rounded-full py-1 pr-1 text-sm font-semibold hover:bg-field lg:pl-3">
            <span className="hidden lg:inline">{profile?.full_name?.split(' ')[0]}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
              {profile?.full_name ? initials(profile.full_name) : <UserIcon size={20} />}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/entrar" className="btn-ghost px-3 sm:px-4">{t('Entrar')}</Link>
            <Link href="/criar-conta" className="btn-primary px-3 sm:px-4">{t('Criar conta')}</Link>
          </div>
        )}
      </div>
    </header>
  );
}
