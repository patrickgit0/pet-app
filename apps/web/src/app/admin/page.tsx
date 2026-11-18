import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, getSession } from '@/lib/supabase/server';
import { formatCnpj } from '@adotai/shared';

export const metadata = { title: 'Admin' };

async function verify(ngoId: string, ok: boolean) {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('admin_verify_ngo', { p_ngo_id: ngoId, p_verified: ok });
  revalidatePath('/admin');
}

export default async function Page() {
  const { supabase, profile } = await getSession();
  if (profile?.role !== 'admin') notFound();
  const [{ data: ngos }, { data: reports }] = await Promise.all([
    supabase.from('ngos').select('id, name, cnpj, city, email, verified_at, created_at').order('verified_at', { nullsFirst: true }).order('created_at'),
    supabase.from('reports').select('id, target_type, reason, created_at').is('resolved_at', null).order('created_at', { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-extrabold">Administração</h1>
      <section className="card overflow-x-auto">
        <h2 className="p-4 font-extrabold">Verificação de ONGs</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-muted"><tr><th className="p-3">ONG</th><th className="p-3">CNPJ</th><th className="p-3">Cidade</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody>
            {(ngos ?? []).map((n) => (
              <tr key={n.id} className="border-t border-line">
                <td className="p-3"><strong>{n.name}</strong><div className="text-xs text-muted">{n.email}</div></td>
                <td className="p-3 font-mono text-xs">
                  <a className="text-brand underline" href={`https://brasilapi.com.br/api/cnpj/v1/${n.cnpj}`} target="_blank" rel="noreferrer">{formatCnpj(n.cnpj)}</a>
                </td>
                <td className="p-3">{n.city}</td>
                <td className="p-3">{n.verified_at ? <span className="chip">Verificada</span> : <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">Pendente</span>}</td>
                <td className="p-3 text-right">
                  <form action={verify.bind(null, n.id, !n.verified_at)}>
                    <button className={n.verified_at ? 'btn-ghost min-h-9 px-3 text-xs' : 'btn-primary min-h-9 px-3 text-xs'}>{n.verified_at ? 'Remover selo' : 'Verificar'}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card p-4">
        <h2 className="mb-2 font-extrabold">Denúncias abertas</h2>
        {(reports ?? []).map((r) => <p key={r.id} className="border-t border-line py-2 text-sm">{r.target_type}: {r.reason}</p>)}
        {!reports?.length && <p className="text-sm text-muted">Nenhuma denúncia aberta.</p>}
      </section>
    </main>
  );
}
