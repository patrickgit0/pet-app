import { ConfirmSubmit } from '@/components/confirm';
import { LangSwitch } from '@/components/lang-switch';
import { getI18n, pageTitle } from '@/i18n/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HOME_LABEL, formatPhone } from '@adotai/shared';
import { getSession, createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/actions';
import { CheckIcon } from '@/components/icons';
import { initials } from '@/lib/utils';

export const generateMetadata = pageTitle('Meu perfil');

async function deleteAccount() {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('delete_my_account');
  await supabase.auth.signOut();
  redirect('/?conta=excluida');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ salvo?: string; senha?: string }> }) {
  const { salvo, senha } = await searchParams;
  const { supabase, user, profile } = await getSession();
  const { t } = await getI18n();
  const [{ data: complete }, { data: priv }] = await Promise.all([
    supabase.rpc('is_profile_complete'),
    supabase.from('profile_private').select('cpf, cpf_verified_at, phone, phone_verified_at, street, complement').eq('id', user!.id).maybeSingle(),
  ]);
  const isAdopter = profile?.role === 'adopter';
  const name = profile?.full_name ?? '';

  const links = isAdopter
    ? [{ href: '/meus-pedidos', label: t('Meus pedidos') }, { href: '/favoritos', label: t('Favoritos') }, { href: '/mensagens', label: t('Mensagens') }]
    : profile?.role === 'ngo_member'
      ? [{ href: '/painel', label: t('Painel da ONG') }, { href: '/mensagens', label: t('Mensagens') }]
      : [{ href: '/admin', label: t('Administração') }];

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 sm:py-10">
      {senha && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Senha alterada.')}</p>}
      {salvo && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Perfil salvo.')}</p>}

      <section className="card flex items-center gap-4 p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-white">{initials(name)}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold">{name}</h1>
          <p className="truncate text-sm text-muted">{user?.email}</p>
          {isAdopter && (complete
            ? <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-dark"><CheckIcon size={13} /> {t('Pronto para adotar')}</p>
            : <p className="mt-1 text-xs text-muted">{t('CPF, celular e endereço são pedidos só na hora de adotar.')}</p>)}
        </div>
      </section>

      <Link href="/perfil/editar" className="btn-ghost bg-white">{t('Editar perfil')}</Link>

      {isAdopter && (
        <section className="card divide-y divide-line px-5 text-sm">
          <Row k={t('CPF')} v={priv?.cpf ? `•••.•••.•••-${priv.cpf.slice(-2)}` : null} ok={Boolean(priv?.cpf_verified_at)} />
          <Row k={t('Celular')} v={priv?.phone ? formatPhone(priv.phone.replace(/^\+55/, '')) : null} />
          <Row k={t('Endereço')} v={priv?.street ? [priv.street, priv.complement].filter(Boolean).join(' · ') : null} />
          <Row k={t('Bairro')} v={[profile?.neighborhood, profile?.city].filter(Boolean).join(', ') || null} />
          <Row k={t('Moradia')} v={profile?.home_type ? t(HOME_LABEL[profile.home_type]) : null} />
        </section>
      )}

      <nav className="card divide-y divide-line px-5 text-sm font-semibold">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex min-h-12 items-center justify-between hover:text-brand">
            {l.label}<span aria-hidden className="text-muted">›</span>
          </Link>
        ))}
      </nav>

      <div className="card flex min-h-12 items-center justify-between px-5 text-sm font-semibold">
        {t('Idioma')}
        <LangSwitch />
      </div>

      <form action={signOut}>
        <ConfirmSubmit title="Sair da conta?" message="Você vai precisar entrar de novo com e-mail e senha." confirmLabel="Sair" className="btn-ghost w-full bg-white">{t('Sair da conta')}</ConfirmSubmit>
      </form>

      <details className="px-1 text-sm">
        <summary className="cursor-pointer py-2 font-semibold text-muted">{t('Privacidade e exclusão de conta')}</summary>
        <p className="mt-2 text-muted">
          {t('Você pode excluir sua conta a qualquer momento. Se já adotou pelo Adotaí, mantemos só o registro mínimo da adoção (sem CPF, celular ou endereço) para o histórico da ONG.')}{' '}
          <Link href="/privacidade" className="font-semibold text-brand underline">{t('Política de Privacidade')}</Link>
        </p>
        <p className="mt-3 text-muted">{t('Você também pode baixar uma cópia de tudo o que o Adotaí guarda sobre você (arquivo JSON).')}</p>
        <a href="/api/meus-dados" download className="btn-ghost mt-2 min-h-10 bg-white px-3 text-sm">{t('Baixar meus dados')}</a>
        <form action={deleteAccount} className="mt-3">
          <ConfirmSubmit title="Excluir sua conta?" message="Seus dados (CPF, celular, endereço, mensagens, favoritos e pedidos) serão apagados. Isso não pode ser desfeito." confirmLabel="Excluir conta" tone="danger" className="btn text-red-700 ring-[1.5px] ring-red-200 ring-inset hover:bg-red-50">{t('Excluir minha conta')}</ConfirmSubmit>
        </form>
      </details>
    </main>
  );
}

function Row({ k, v, ok }: { k: string; v: string | null; ok?: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <span className="text-muted">{k}</span>
      <span className={`flex min-w-0 items-center gap-1 truncate text-right ${v ? 'font-semibold' : 'text-muted'}`}>
        {ok && <CheckIcon size={14} className="shrink-0 text-brand" />}{v ?? '—'}
      </span>
    </div>
  );
}
