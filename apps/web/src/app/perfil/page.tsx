import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HOME_LABEL } from '@adotai/shared';
import { getSession, createClient } from '@/lib/supabase/server';
import { CheckIcon } from '@/components/icons';

export const metadata = { title: 'Meu perfil' };

async function deleteAccount() {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('delete_my_account');
  await supabase.auth.signOut();
  redirect('/?conta=excluida');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ salvo?: string }> }) {
  const { salvo } = await searchParams;
  const { supabase, user, profile } = await getSession();
  const { data: complete } = await supabase.rpc('is_profile_complete');
  const { data: priv } = await supabase.from('profile_private').select('cpf_verified_at, phone_verified_at, cep').eq('id', user!.id).maybeSingle();

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 py-10">
      <h1 className="text-2xl font-extrabold">Meu perfil</h1>
      {salvo && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">Perfil salvo.</p>}
      <div className="card flex flex-col gap-3 p-6 text-sm">
        <Row k="Nome" v={profile?.full_name ?? ''} />
        <Row k="E-mail" v={user?.email ?? ''} />
        <Row k="CPF" v={priv?.cpf_verified_at ? 'Verificado' : 'Não informado'} ok={Boolean(priv?.cpf_verified_at)} />
        <Row k="Celular" v={priv?.phone_verified_at ? 'Verificado' : 'Não verificado'} ok={Boolean(priv?.phone_verified_at)} />
        <Row k="Bairro" v={[profile?.neighborhood, profile?.city].filter(Boolean).join(', ') || 'Não informado'} />
        <Row k="Moradia" v={profile?.home_type ? HOME_LABEL[profile.home_type] : 'Não informado'} />
      </div>
      {profile?.role === 'adopter' && (
        <div className={`rounded-xl p-4 text-sm ${complete ? 'bg-brand-soft text-brand-dark' : 'bg-accent-soft text-accent-ink'}`}>
          {complete ? 'Seu perfil está completo: você já pode pedir adoções.' : 'Para pedir uma adoção, complete seu perfil com CPF, celular e endereço.'}
        </div>
      )}
      <Link href="/perfil/completar" className="btn-primary">{complete ? 'Editar dados de adoção' : 'Completar perfil'}</Link>

      <details className="card p-5 text-sm">
        <summary className="cursor-pointer font-bold">Privacidade e exclusão de conta (LGPD)</summary>
        <p className="mt-3 text-muted">
          Você pode excluir sua conta a qualquer momento. Se você já adotou pelo Adotaí, mantemos apenas o registro mínimo da adoção
          (sem CPF, celular ou endereço) para o histórico da ONG.
        </p>
        <form action={deleteAccount} className="mt-3">
          <button className="btn text-red-700 ring-[1.5px] ring-red-200 ring-inset hover:bg-red-50">Excluir minha conta</button>
        </form>
      </details>
    </main>
  );
}

function Row({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{k}</span>
      <span className="flex items-center gap-1 font-semibold">{ok && <CheckIcon size={14} className="text-brand" />}{v}</span>
    </div>
  );
}
