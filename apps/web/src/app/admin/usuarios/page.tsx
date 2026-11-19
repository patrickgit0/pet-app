import { ConfirmSubmit } from '@/components/confirm';
import { getI18n } from '@/i18n/server';
import { getSession } from '@/lib/supabase/server';
import Link from 'next/link';
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
  const { t, locale } = await getI18n();
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
      <PageTitle title={t('Usuários')} subtitle={t('{n} contas. O CPF nunca aparece aqui (LGPD).', { n: total })}>
        <a href="/api/admin/export/usuarios" download className="btn-ghost min-h-9 bg-white px-3 text-xs">{t('Exportar CSV')}</a>
      </PageTitle>
      <SearchBar q={sp.q} placeholder="Nome ou e-mail">
        <select name="papel" defaultValue={sp.papel ?? ''} className="field h-11 w-auto text-sm">
          <option value="">{t('Todos')}</option><option value="adopter">{t('Adotantes')}</option><option value="ngo_member">{t('ONGs')}</option><option value="admin">{t('Admins')}</option>
        </select>
      </SearchBar>
      <ul className="card divide-y divide-line">
        {(users ?? []).map((u) => (
          <li key={u.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/usuarios/${u.id}`} className="font-bold underline decoration-line-2 underline-offset-2 hover:text-brand">{u.full_name}</Link>
                <Badge tone={u.role === 'admin' ? 'bad' : u.role === 'ngo_member' ? 'good' : 'neutral'}>{t(ROLE[u.role])}</Badge>
                {u.role === 'adopter' && (u.profile_complete ? <Badge tone="good">{t('Perfil completo')}</Badge> : <Badge>{t('Só cadastro')}</Badge>)}
              </div>
              <p className="truncate text-xs text-muted">{u.email}{u.ngo_name && ` · ${u.ngo_name}`}{u.city && ` · ${[u.neighborhood, u.city].filter(Boolean).join(', ')}`}</p>
              <p className="text-xs text-muted">
                {t('Desde {a} · último acesso {b}', { a: fmtDate(u.created_at, locale), b: fmtDate(u.last_sign_in_at, locale) })}
                {u.role === 'adopter' && ` · ${t('{a} pedidos · {b} adoções', { a: u.requests, b: u.adoptions })}`}
              </p>
            </div>
            {u.id !== user?.id && (
              <form action={setUserRole.bind(null, u.id)} className="flex gap-2">
                <select name="role" defaultValue={u.role} aria-label={t('Papel de {name}', { name: u.full_name })} className="field h-9 w-auto text-xs">
                  <option value="adopter">{t('Adotante')}</option><option value="ngo_member">{t('ONG')}</option><option value="admin">{t('Admin')}</option>
                </select>
                <ConfirmSubmit title="Trocar o papel desta conta?" message="Admins enxergam tudo na plataforma. Confira antes de salvar." confirmLabel="Salvar" className="btn-ghost min-h-9 px-3 text-xs">{t('Salvar')}</ConfirmSubmit>
              </form>
            )}
          </li>
        ))}
        {!users?.length && <li className="p-6 text-center text-sm text-muted">{t('Nenhum usuário encontrado.')}</li>}
      </ul>
      <Pager page={page} total={total} size={SIZE} href={href} />
    </>
  );
}
