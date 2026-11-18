-- Painel administrativo: indicadores e listas que precisam de dados fora do alcance do RLS
-- (ex.: e-mail e último acesso, que ficam em auth.users). Tudo exige is_admin(). CPF nunca sai daqui.

-- ---------------------------------------------------------------------------
-- Indicadores do painel (um único JSON para a página carregar com 1 chamada)
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  select jsonb_build_object(
    'users', (select jsonb_build_object(
        'total', count(*),
        'adopters', count(*) filter (where role = 'adopter'),
        'ngo_members', count(*) filter (where role = 'ngo_member'),
        'complete', count(*) filter (where profile_completed_at is not null),
        'new_7d', count(*) filter (where created_at > now() - interval '7 days'),
        'new_30d', count(*) filter (where created_at > now() - interval '30 days'))
      from public.profiles),
    'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'ngos', (select jsonb_build_object(
        'total', count(*),
        'verified', count(*) filter (where verified_at is not null),
        'pending', count(*) filter (where verified_at is null))
      from public.ngos),
    'animals', (select jsonb_build_object(
        'available', count(*) filter (where status = 'available'),
        'reserved', count(*) filter (where status = 'reserved'),
        'adopted', count(*) filter (where status = 'adopted'),
        'draft', count(*) filter (where status = 'draft'),
        'archived', count(*) filter (where status = 'archived'),
        'dogs', count(*) filter (where species = 'dog' and status = 'available'),
        'cats', count(*) filter (where species = 'cat' and status = 'available'),
        'no_photo', count(*) filter (where status = 'available'
          and not exists (select 1 from public.animal_photos p where p.animal_id = a.id)),
        'median_days_waiting', (select percentile_cont(0.5) within group (
            order by extract(epoch from now() - coalesce(published_at, created_at)) / 86400)
          from public.animals where status = 'available'))
      from public.animals a),
    'requests', (select jsonb_build_object(
        'open', count(*) filter (where status in ('sent', 'reviewing', 'visit_scheduled')),
        'waiting_48h', count(*) filter (where status = 'sent' and created_at < now() - interval '48 hours'),
        'approved', count(*) filter (where status = 'approved'),
        'rejected', count(*) filter (where status = 'rejected'),
        'cancelled', count(*) filter (where status = 'cancelled'),
        'last_30d', count(*) filter (where created_at > now() - interval '30 days'))
      from public.adoption_requests),
    'adoptions', (select jsonb_build_object(
        'total', count(*),
        'last_30d', count(*) filter (where adopted_at > now() - interval '30 days'),
        'returned', count(*) filter (where status = 'returned'))
      from public.adoptions),
    'checkins', (select jsonb_build_object(
        'late', count(*) filter (where status = 'late' or (status = 'pending' and due_at < now())),
        'needs_help', count(*) filter (where needs_help and ngo_followed_up_at is null),
        'answered_rate', round(100.0 * count(*) filter (where status = 'answered')
          / nullif(count(*) filter (where due_at < now()), 0)))
      from public.checkins),
    'messages_7d', (select count(*) from public.messages where created_at > now() - interval '7 days'),
    'reports_open', (select count(*) from public.reports where resolved_at is null),
    -- Funil: cadastro → perfil completo → pediu adoção → adotou
    'funnel', jsonb_build_object(
      'signed_up', (select count(*) from public.profiles where role = 'adopter'),
      'completed', (select count(*) from public.profiles where role = 'adopter' and profile_completed_at is not null),
      'requested', (select count(distinct adopter_id) from public.adoption_requests),
      'adopted', (select count(distinct adopter_id) from public.adoptions)),
    -- Séries semanais (últimas 12 semanas)
    'weekly', (select coalesce(jsonb_agg(w order by w->>'week'), '[]'::jsonb) from (
      select jsonb_build_object(
        'week', to_char(s.week, 'YYYY-MM-DD'),
        'signups', (select count(*) from public.profiles p where p.created_at >= s.week and p.created_at < s.week + interval '7 days'),
        'requests', (select count(*) from public.adoption_requests r where r.created_at >= s.week and r.created_at < s.week + interval '7 days'),
        'adoptions', (select count(*) from public.adoptions d where d.adopted_at >= s.week and d.adopted_at < s.week + interval '7 days')) as w
      from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') as s(week)
    ) t),
    -- ONGs que precisam de atenção
    'ngo_health', (select coalesce(jsonb_agg(x order by (x->>'open_requests')::int desc), '[]'::jsonb) from (
      select jsonb_build_object(
        'id', n.id, 'name', n.name, 'slug', n.slug, 'verified', n.verified_at is not null,
        'rating', n.rating, 'adoptions', n.completed_adoptions, 'response_min', n.median_response_minutes,
        'available', (select count(*) from public.animals a where a.ngo_id = n.id and a.status = 'available'),
        'open_requests', (select count(*) from public.adoption_requests r where r.ngo_id = n.id and r.status in ('sent', 'reviewing', 'visit_scheduled')),
        'stale_requests', (select count(*) from public.adoption_requests r where r.ngo_id = n.id and r.status = 'sent' and r.created_at < now() - interval '48 hours'),
        'late_checkins', (select count(*) from public.checkins c join public.adoptions d on d.id = c.adoption_id
                          where d.ngo_id = n.id and (c.status = 'late' or (c.status = 'pending' and c.due_at < now())))) as x
      from public.ngos n
    ) t)
  ) into v;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- Usuários (clientes) com e-mail e último acesso. Sem CPF.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users(
  p_query text default null, p_role public.user_role default null, p_limit int default 50, p_offset int default 0
)
returns table (
  id uuid, full_name text, email text, role public.user_role, city text, neighborhood text,
  profile_complete boolean, phone_verified boolean, created_at timestamptz, last_sign_in_at timestamptz,
  requests bigint, adoptions bigint, ngo_name text, total_count bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return query
  select p.id, p.full_name, u.email::text, p.role, p.city, p.neighborhood,
    p.profile_completed_at is not null, pp.phone_verified_at is not null, p.created_at, u.last_sign_in_at,
    (select count(*) from public.adoption_requests r where r.adopter_id = p.id),
    (select count(*) from public.adoptions d where d.adopter_id = p.id),
    (select n.name from public.ngo_members m join public.ngos n on n.id = m.ngo_id where m.user_id = p.id limit 1),
    count(*) over ()
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.profile_private pp on pp.id = p.id
  where (p_role is null or p.role = p_role)
    and (p_query is null or p.full_name ilike '%' || p_query || '%' or u.email ilike '%' || p_query || '%')
  order by p.created_at desc
  limit least(p_limit, 200) offset p_offset;
end $$;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_user_id = auth.uid() and p_role <> 'admin' then raise exception 'CANNOT_DEMOTE_SELF'; end if;
  update public.profiles set role = p_role where id = p_user_id;
end $$;

-- Moderação de anúncio (ex.: arquivar anúncio irregular)
create or replace function public.admin_set_animal_status(p_animal_id uuid, p_status public.animal_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.animals set status = p_status where id = p_animal_id;
end $$;

create or replace function public.admin_resolve_report(p_report_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.reports set resolved_at = now() where id = p_report_id;
end $$;

revoke execute on function public.admin_dashboard, public.admin_list_users, public.admin_set_user_role,
  public.admin_set_animal_status, public.admin_resolve_report from anon, public;
grant execute on function public.admin_dashboard, public.admin_list_users, public.admin_set_user_role,
  public.admin_set_animal_status, public.admin_resolve_report to authenticated;
