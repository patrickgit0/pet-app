import { getSession } from '@/lib/supabase/server';
import type { Database } from '@adotai/shared';
import { setUserRole } from '../actions';
import { Badge, PageTitle, Pager, SearchBar, fmtDate } from '../ui';

type Role = Database['public']['Enums']['user_role'];
type SP = Promise<{ q?: string; papel?: string; page?: string }>;
const SIZE = 50;
const ROLE: Record<Role, string> = { adopter: 'Adotante', ngo_member: 'ONG', admin: 'Admin' };

export default async function AdminUsers({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const { supabase, user } = await getSession();
  const { data: users } = await supabase.rpc('admin_list_users', {
    p_query: sp.q?.trim() || undefined,
    p_role: (sp.papel as Role) || undefined,
    p_limit: SIZE,
    p_offset: (page - 1) * SIZE,
  });
  const total = Number(users?.[0]?.total_count ?? 0);
  const href = (p: number) => `/admin/usuarios?${new URLSearchParams({ ...(sp.q && { q: sp.q }), ...(sp.papel && { papel: sp.papel }), page: String(p) })}`;

  return (
    <>
      <PageTitle title="Usuários" subtitle={`${total} contas. O CPF nunca aparece aqui (LGPD).`} />
      <SearchBar q={sp.q} placeholder="Nome ou e-mail">
        <select name="papel" defaultValue={sp.papel ?? ''} className="field h-11 w-auto text-sm">
          <option value="">Todos</option><option value="adopter">Adotantes</option><option value="ngo_member">ONGs</option><option value="admin">Admins</option>
        </select>
      </SearchBar>
      <ul className="card divide-y divide-line">
        {(users ?? []).map((u) => (
          <li key={u.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{u.full_name}</strong>
                <Badge tone={u.role === 'admin' ? 'bad' : u.role === 'ngo_member' ? 'good' : 'neutral'}>{ROLE[u.role]}</Badge>
                {u.role === 'adopter' && (u.profile_complete ? <Badge tone="good">Perfil completo</Badge> : <Badge>Só cadastro</Badge>)}
              </div>
              <p className="truncate text-xs text-muted">{u.email}{u.ngo_name && ` · ${u.ngo_name}`}{u.city && ` · ${[u.neighborhood, u.city].filter(Boolean).join(', ')}`}</p>
              <p className="text-xs text-muted">
                Desde {fmtDate(u.created_at)} · último acesso {fmtDate(u.last_sign_in_at)}
                {u.role === 'adopter' && ` · ${u.requests} pedidos · ${u.adoptions} adoções`}
              </p>
            </div>
            {u.id !== user?.id && (
              <form action={setUserRole.bind(null, u.id)} className="flex gap-2">
                <select name="role" defaultValue={u.role} aria-label={`Papel de ${u.full_name}`} className="field h-9 w-auto text-xs">
                  <option value="adopter">Adotante</option><option value="ngo_member">ONG</option><option value="admin">Admin</option>
                </select>
                <button className="btn-ghost min-h-9 px-3 text-xs">Salvar</button>
              </form>
            )}
          </li>
        ))}
        {!users?.length && <li className="p-6 text-center text-sm text-muted">Nenhum usuário encontrado.</li>}
      </ul>
      <Pager page={page} total={total} size={SIZE} href={href} />
    </>
  );
}
