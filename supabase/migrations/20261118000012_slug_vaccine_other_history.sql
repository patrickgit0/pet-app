-- 1) Outros animais (além de cães e gatos)
-- 2) Código curto para o link bonito: /animais/thor-3f2a9c
-- 3) Foto da carteirinha de vacinação
-- 4) Histórico de status dos pedidos (linha do tempo no admin)
-- 5) Detalhe de usuário para o admin (e-mail, celular; nunca o CPF)

alter type public.species add value if not exists 'other';

-- ---------------------------------------------------------------------------
-- Código curto (6 caracteres), único e fixo: o nome pode mudar sem quebrar links
-- ---------------------------------------------------------------------------
alter table public.animals add column code text;
update public.animals set code = substr(md5(id::text), 1, 6) where code is null;
alter table public.animals alter column code set default substr(md5(gen_random_uuid()::text), 1, 6);
alter table public.animals alter column code set not null;
create unique index animals_code_key on public.animals (code);

create or replace function public.animals_code()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.code := old.code;
    return new;
  end if;
  while new.code is null or exists (select 1 from public.animals where code = new.code) loop
    new.code := substr(md5(gen_random_uuid()::text), 1, 6);
  end loop;
  return new;
end $$;
create trigger animals_code before insert or update on public.animals
  for each row execute function public.animals_code();

-- ---------------------------------------------------------------------------
-- Carteirinha de vacinação (bucket animal-photos: <ngo_id>/<animal_id>/vacina-*.jpg)
-- ---------------------------------------------------------------------------
alter table public.animals add column vaccination_card_path text;

-- ---------------------------------------------------------------------------
-- Busca devolve o código (para montar o link)
-- ---------------------------------------------------------------------------
drop function if exists public.search_animals(double precision, double precision, int, public.species[], public.animal_size[],
  public.animal_sex[], text[], boolean, boolean, boolean, boolean, boolean, boolean, text, text, int, int);

create or replace function public.search_animals(
  p_lat double precision,
  p_lng double precision,
  p_radius_km int default 10,
  p_species public.species[] default null,
  p_sizes public.animal_size[] default null,
  p_sexes public.animal_sex[] default null,
  p_age_groups text[] default null,           -- 'puppy' (<1 ano), 'adult', 'senior' (>=7 anos)
  p_neutered boolean default null,
  p_good_with_kids boolean default null,
  p_good_with_dogs boolean default null,
  p_good_with_cats boolean default null,
  p_good_for_apartment boolean default null,
  p_verified_only boolean default false,
  p_query text default null,
  p_sort text default 'recommended',
  p_limit int default 24,
  p_offset int default 0
) returns table (
  id uuid,
  name text,
  code text,
  species public.species,
  sex public.animal_sex,
  size public.animal_size,
  age_months int,
  breed text,
  neutered boolean,
  vaccinated boolean,
  good_with_kids boolean,
  status public.animal_status,
  distance_km numeric,
  cover_path text,
  ngo_id uuid,
  ngo_name text,
  ngo_slug text,
  ngo_verified boolean,
  ngo_rating numeric,
  published_at timestamptz,
  approx_lat numeric,   -- arredondado (~1 km) para o mapa: não expõe o ponto exato
  approx_lng numeric,
  total_count bigint
) language sql stable set search_path = '' as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  ),
  base as (
    select
      a.*,
      n.name as n_name, n.slug as n_slug, n.verified_at is not null as n_verified, n.rating as n_rating,
      extensions.st_distance(a.location, o.g) / 1000.0 as dist_km,
      case when a.birth_date_estimate is null then null
           else (extract(year from age(a.birth_date_estimate)) * 12 + extract(month from age(a.birth_date_estimate)))::int
      end as age_m
    from public.animals a
    join public.ngos n on n.id = a.ngo_id
    cross join origin o
    where a.status = 'available'
      and extensions.st_dwithin(a.location, o.g, p_radius_km * 1000)
      and (p_species is null or a.species = any (p_species))
      and (p_sizes is null or a.size = any (p_sizes))
      and (p_sexes is null or a.sex = any (p_sexes))
      and (p_neutered is null or a.neutered = p_neutered)
      and (p_good_with_kids is null or a.good_with_kids = p_good_with_kids)
      and (p_good_with_dogs is null or a.good_with_dogs = p_good_with_dogs)
      and (p_good_with_cats is null or a.good_with_cats = p_good_with_cats)
      and (p_good_for_apartment is null or a.good_for_apartment = p_good_for_apartment)
      and (not p_verified_only or n.verified_at is not null)
      and (p_query is null or a.name ilike '%' || p_query || '%' or a.breed ilike '%' || p_query || '%'
           or n.name ilike '%' || p_query || '%')
  ),
  filtered as (
    select * from base b
    where p_age_groups is null
       or ('puppy' = any (p_age_groups) and b.age_m < 12)
       or ('adult' = any (p_age_groups) and b.age_m >= 12 and b.age_m < 84)
       or ('senior' = any (p_age_groups) and b.age_m >= 84)
  )
  select
    f.id, f.name, f.code, f.species, f.sex, f.size, f.age_m, f.breed, f.neutered, f.vaccinated, f.good_with_kids,
    f.status,
    round(f.dist_km::numeric, 1) as distance_km,
    (select ph.storage_path from public.animal_photos ph where ph.animal_id = f.id order by ph.position limit 1),
    f.ngo_id, f.n_name, f.n_slug, f.n_verified, f.n_rating, f.published_at,
    round(extensions.st_y(f.location::extensions.geometry)::numeric, 2),
    round(extensions.st_x(f.location::extensions.geometry)::numeric, 2),
    count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'distance' then f.dist_km end asc nulls last,
    case when p_sort = 'rating' then (f.n_verified)::int end desc nulls last,
    case when p_sort = 'rating' then f.n_rating end desc nulls last,
    case when p_sort = 'recent' then f.published_at end desc nulls last,
    case when p_sort = 'oldest' then f.published_at end asc nulls last,
    -- recommended: 60% proximidade + 40% nota (ONG sem nota conta como 3,5)
    case when p_sort not in ('distance', 'rating', 'recent', 'oldest') then
      0.6 * (1 - least(f.dist_km / greatest(p_radius_km, 1), 1))
      + 0.4 * (coalesce(f.n_rating, 3.5) / 5.0)
      + case when f.n_verified then 0.05 else 0 end
    end desc nulls last,
    f.dist_km asc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;
grant execute on function public.search_animals to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Histórico dos pedidos: cada mudança de status vira um evento (quem, quando, motivo)
-- ---------------------------------------------------------------------------
create table public.adoption_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.adoption_requests (id) on delete cascade,
  status public.request_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index adoption_request_events_request_idx on public.adoption_request_events (request_id, created_at);
alter table public.adoption_request_events enable row level security;
create policy "request events read" on public.adoption_request_events for select to authenticated
  using (exists (select 1 from public.adoption_requests r where r.id = request_id
    and (r.adopter_id = auth.uid() or public.is_ngo_member(r.ngo_id) or public.is_admin())));

create or replace function public.log_request_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.adoption_request_events (request_id, status, actor_id, note)
    values (new.id, new.status, auth.uid(), case when new.status = 'rejected' then new.rejection_reason end);
  end if;
  return new;
end $$;
revoke execute on function public.log_request_event from anon, authenticated, public;
create trigger adoption_requests_log after insert or update of status on public.adoption_requests
  for each row execute function public.log_request_event();

-- Pedidos que já existiam: "enviado" na criação + status atual na última atualização
insert into public.adoption_request_events (request_id, status, actor_id, created_at)
  select id, 'sent', adopter_id, created_at from public.adoption_requests;
insert into public.adoption_request_events (request_id, status, note, created_at)
  select id, status, case when status = 'rejected' then rejection_reason end, coalesce(approved_at, updated_at)
  from public.adoption_requests where status <> 'sent';

-- ---------------------------------------------------------------------------
-- Detalhe de usuário para o admin. CPF nunca sai: só se é válido.
-- ---------------------------------------------------------------------------
create or replace function public.admin_user_detail(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'email', u.email,
    'email_confirmed_at', u.email_confirmed_at,
    'last_sign_in_at', u.last_sign_in_at,
    'phone', pp.phone,
    'cpf_valid', pp.cpf is not null,
    'lgpd_consent_at', pp.lgpd_consent_at,
    'ngo', (select jsonb_build_object('name', n.name, 'slug', n.slug, 'role', m.role)
            from public.ngo_members m join public.ngos n on n.id = m.ngo_id where m.user_id = u.id limit 1),
    'favorites', (select count(*) from public.favorites f where f.user_id = u.id),
    'conversations', (select count(*) from public.conversations c where c.adopter_id = u.id),
    'reports_against', (select count(*) from public.reports r where r.target_type = 'user' and r.target_id = u.id)
  ) into v
  from auth.users u left join public.profile_private pp on pp.id = u.id
  where u.id = p_user_id;
  return v;
end $$;
revoke execute on function public.admin_user_detail from anon, public;
grant execute on function public.admin_user_detail to authenticated;
