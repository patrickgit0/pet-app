import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { PawIcon, UserIcon } from './icons';
import { initials } from '@/lib/utils';

export async function SiteHeader() {
  const { user, profile, supabase } = await getSession();

  let unread = 0;
  if (user) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
      .neq('sender_id', user.id);
    unread = count ?? 0;
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
          <Link href="/">Adotar</Link>
          <Link href="/ongs">ONGs</Link>
          {user && (
            <Link href="/mensagens" className="relative">
              Mensagens
              {unread > 0 && (
                <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px] font-extrabold text-ink lg:absolute lg:-top-2 lg:-right-4 lg:ml-0">
                  {unread}
                </span>
              )}
            </Link>
          )}
          {user && !isNgo && <Link href="/meus-pedidos">Meus pedidos</Link>}
          {user && !isNgo && <Link href="/favoritos">Favoritos</Link>}
          {isNgo && <Link href="/painel">Painel da ONG</Link>}
          {isAdmin && <Link href="/admin">Admin</Link>}
          {!user && <Link href="/sou-ong">Sou ONG</Link>}
        </nav>
        {user ? (
          <Link href="/perfil" aria-label="Meu perfil" title="Meu perfil" className="flex items-center gap-2 rounded-full py-1 pr-1 text-sm font-semibold hover:bg-field lg:pl-3">
            <span className="hidden lg:inline">{profile?.full_name?.split(' ')[0]}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
              {profile?.full_name ? initials(profile.full_name) : <UserIcon size={20} />}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/entrar" className="btn-ghost px-3 sm:px-4">Entrar</Link>
            <Link href="/criar-conta" className="btn-primary px-3 sm:px-4">Criar conta</Link>
          </div>
        )}
      </div>
    </header>
  );
}
