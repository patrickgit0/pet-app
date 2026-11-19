-- Adotaí — Perguntas da ONG, feiras de adoção, lar temporário e finais felizes (migration 14)

-- ---------------------------------------------------------------------------
-- Perguntas extras da ONG no pedido (até 5, cada uma até 200 caracteres)
-- As respostas vão em adoption_requests.answers (já existe), junto do compromisso de guarda responsável.
-- ---------------------------------------------------------------------------
alter table public.ngos add column if not exists application_questions jsonb not null default '[]'::jsonb;
alter table public.ngos drop constraint if exists ngos_application_questions_check;
alter table public.ngos add constraint ngos_application_questions_check check (
  jsonb_typeof(application_questions) = 'array' and jsonb_array_length(application_questions) <= 5
  and char_length(application_questions::text) <= 1200);
grant update (application_questions) on public.ngos to authenticated;

-- Respostas com tamanho limitado (evita payload gigante via API)
alter table public.adoption_requests drop constraint if exists adoption_requests_answers_size;
alter table public.adoption_requests add constraint adoption_requests_answers_size check (char_length(answers::text) <= 6000);

-- ---------------------------------------------------------------------------
-- Feiras de adoção
-- ---------------------------------------------------------------------------
create table if not exists public.ngo_events (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  place text not null check (char_length(place) between 3 and 200),
  neighborhood text check (char_length(neighborhood) <= 80),
  city text not null default 'Ribeirão Preto' check (char_length(city) <= 80),
  description text check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at - starts_at <= interval '3 days')
);
create index if not exists ngo_events_upcoming_idx on public.ngo_events (ends_at);
alter table public.ngo_events enable row level security;
create policy ngo_events_select on public.ngo_events for select to anon, authenticated using (true);
create policy ngo_events_write on public.ngo_events for all to authenticated
  using (public.is_ngo_member(ngo_id)) with check (public.is_ngo_member(ngo_id));

-- ---------------------------------------------------------------------------
-- Lar temporário: pessoa se oferece; ONGs verificadas veem a lista
-- ---------------------------------------------------------------------------
create table if not exists public.foster_offers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  species public.species[] not null default array['dog', 'cat']::public.species[],
  sizes public.animal_size[] not null default array['small', 'medium']::public.animal_size[],
  max_weeks int not null default 4 check (max_weeks between 1 and 52),
  has_other_pets boolean,
  notes text check (char_length(notes) <= 600),
  contact_phone text check (contact_phone is null or contact_phone ~ '^55[1-9][0-9]9[0-9]{8}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger foster_offers_updated_at before update on public.foster_offers
  for each row execute function public.set_updated_at();
alter table public.foster_offers enable row level security;
revoke all on public.foster_offers from anon;
create policy foster_own on public.foster_offers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy foster_ngo_read on public.foster_offers for select to authenticated
  using (active and exists (
    select 1 from public.ngo_members m join public.ngos n on n.id = m.ngo_id
    where m.user_id = auth.uid() and n.verified_at is not null
  ) or public.is_admin());

-- Lista para a ONG: nome e bairro do voluntário (perfil) + oferta. Só ONG verificada.
create or replace function public.list_foster_offers()
returns table (user_id uuid, full_name text, neighborhood text, city text, species public.species[], sizes public.animal_size[],
  max_weeks int, has_other_pets boolean, notes text, contact_phone text, updated_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.ngo_members m join public.ngos n on n.id = m.ngo_id
                 where m.user_id = auth.uid() and n.verified_at is not null) and not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select f.user_id, p.full_name, p.neighborhood, p.city, f.species, f.sizes, f.max_weeks, f.has_other_pets, f.notes,
           f.contact_phone, f.updated_at
    from public.foster_offers f join public.profiles p on p.id = f.user_id
    where f.active
    order by f.updated_at desc;
end $$;
revoke execute on function public.list_foster_offers from anon, public;
grant execute on function public.list_foster_offers to authenticated;

-- Aviso às ONGs verificadas quando alguém se oferece (só na primeira vez)
create or replace function public.on_foster_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n record;
begin
  for n in select id from public.ngos where verified_at is not null loop
    perform public.notify_ngo(n.id, 'foster', jsonb_build_object('name', (select full_name from public.profiles where id = new.user_id)), '/painel/lar-temporario');
  end loop;
  return new;
end $$;
drop trigger if exists foster_after_insert on public.foster_offers;
create trigger foster_after_insert after insert on public.foster_offers
  for each row execute function public.on_foster_insert();

-- ---------------------------------------------------------------------------
-- Finais felizes: animais adotados pela ONG (sem dados do adotante)
-- ---------------------------------------------------------------------------
create or replace function public.ngo_happy_endings(p_ngo_id uuid, p_limit int default 12)
returns table (animal_name text, species public.species, cover_path text, adopted_at timestamptz, review_comment text, review_stars int)
language sql stable security definer set search_path = '' as $$
  select a.name, a.species,
    (select ph.storage_path from public.animal_photos ph where ph.animal_id = a.id order by ph.position limit 1),
    ad.adopted_at, r.comment, r.stars
  from public.adoptions ad
  join public.animals a on a.id = ad.animal_id
  left join public.reviews r on r.adoption_id = ad.id and r.hidden_at is null
  where ad.ngo_id = p_ngo_id and ad.status = 'active'
  order by ad.adopted_at desc
  limit least(greatest(p_limit, 1), 48);
$$;
grant execute on function public.ngo_happy_endings to anon, authenticated;
