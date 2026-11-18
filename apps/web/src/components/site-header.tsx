import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { PawIcon } from './icons';
import { signOut } from '@/app/(auth)/actions';

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
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-7 gap-y-3 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-[22px] font-extrabold text-brand">
          <PawIcon size={28} />
          Adotaí
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-5 text-sm font-semibold">
          <Link href="/">Adotar</Link>
          <Link href="/ongs">ONGs</Link>
          {user && (
            <Link href="/mensagens" className="relative">
              Mensagens
              {unread > 0 && (
                <span className="absolute -top-2 -right-4 rounded-full bg-accent px-1.5 text-[10px] font-extrabold text-ink">
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
          <div className="flex items-center gap-3 text-sm">
            <Link href="/perfil" className="font-semibold">
              {profile?.full_name?.split(' ')[0] ?? 'Perfil'}
            </Link>
            <form action={signOut}>
              <button className="btn-ghost min-h-9 px-3">Sair</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/entrar" className="btn-ghost">Entrar</Link>
            <Link href="/criar-conta" className="btn-primary">Criar conta</Link>
          </div>
        )}
      </div>
    </header>
  );
}
