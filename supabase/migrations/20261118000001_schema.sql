-- Vira Lar — schema base
-- Regras de produto: privacidade do adotante, cadastro em 2 etapas, chat ligado a animal.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('adopter', 'ngo_member', 'admin');
create type public.ngo_member_role as enum ('owner', 'volunteer');
create type public.species as enum ('dog', 'cat');
create type public.animal_sex as enum ('male', 'female');
create type public.animal_size as enum ('small', 'medium', 'large');
create type public.energy_level as enum ('low', 'medium', 'high');
create type public.animal_status as enum ('draft', 'available', 'reserved', 'adopted', 'archived');
create type public.home_type as enum ('house', 'apartment', 'farm');
create type public.request_status as enum ('sent', 'reviewing', 'visit_scheduled', 'approved', 'rejected', 'cancelled');
create type public.adoption_status as enum ('active', 'returned');
create type public.checkin_status as enum ('pending', 'answered', 'late');
create type public.message_kind as enum ('text', 'image', 'visit_proposal', 'system');

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Perfis
-- profiles: dados que a ONG pode ver de um candidato (nome, bairro, moradia).
-- profile_private: CPF, celular, endereço — só o próprio usuário lê.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 120),
  avatar_url text,
  role public.user_role not null default 'adopter',
  -- endereço "público" (vindo do CEP)
  neighborhood text,
  city text,
  state char(2),
  location extensions.geography(point, 4326),
  -- perfil de moradia
  home_type public.home_type,
  has_yard boolean,
  has_children boolean,
  other_pets text,
  routine_notes text,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  cpf char(11) unique check (cpf ~ '^[0-9]{11}$'),
  cpf_verified_at timestamptz,
  phone text check (phone ~ '^\+55[0-9]{10,11}$'),
  phone_verified_at timestamptz,
  cep char(8) check (cep ~ '^[0-9]{8}$'),
  street text,
  complement text,
  lgpd_consent_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger profile_private_updated_at before update on public.profile_private
  for each row execute function public.set_updated_at();

-- Cria o perfil quando o usuário se cadastra (etapa 1: nome, e-mail, senha)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Sem nome'));
  insert into public.profile_private (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ONGs
-- ---------------------------------------------------------------------------
create table public.ngos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  cnpj char(14) not null unique check (cnpj ~ '^[0-9]{14}$'),
  description text,
  email text,
  phone text,
  pix_key text,
  logo_url text,
  address_text text,
  neighborhood text,
  city text not null,
  state char(2) not null,
  location extensions.geography(point, 4326) not null,
  verified_at timestamptz,
  -- métricas mantidas por recompute_ngo_rating()
  rating numeric(2, 1),
  rating_count int not null default 0,
  completed_adoptions int not null default 0,
  median_response_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ngos_location_idx on public.ngos using gist (location);
create trigger ngos_updated_at before update on public.ngos
  for each row execute function public.set_updated_at();

create table public.ngo_members (
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.ngo_member_role not null default 'volunteer',
  created_at timestamptz not null default now(),
  primary key (ngo_id, user_id)
);
create index ngo_members_user_idx on public.ngo_members (user_id);

-- ---------------------------------------------------------------------------
-- Animais
-- ---------------------------------------------------------------------------
create table public.animals (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  name text not null,
  species public.species not null,
  sex public.animal_sex not null,
  size public.animal_size not null,
  birth_date_estimate date,
  breed text not null default 'SRD',
  description text,
  energy public.energy_level,
  neutered boolean,
  vaccinated boolean,
  dewormed boolean,
  special_needs text,
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  good_for_apartment boolean,
  status public.animal_status not null default 'draft',
  location extensions.geography(point, 4326),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index animals_location_idx on public.animals using gist (location);
create index animals_status_idx on public.animals (status, species);
create index animals_ngo_idx on public.animals (ngo_id);
create trigger animals_updated_at before update on public.animals
  for each row execute function public.set_updated_at();

-- Animal herda a localização da ONG se não tiver uma; marca published_at
create or replace function public.animals_defaults()
returns trigger language plpgsql as $$
begin
  if new.location is null then
    select location into new.location from public.ngos where id = new.ngo_id;
  end if;
  if new.status = 'available' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end $$;
create trigger animals_defaults before insert or update on public.animals
  for each row execute function public.animals_defaults();

create table public.animal_photos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index animal_photos_animal_idx on public.animal_photos (animal_id, position);

-- ---------------------------------------------------------------------------
-- Favoritos e buscas salvas
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, animal_id)
);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text,
  filters jsonb not null default '{}'::jsonb,
  center extensions.geography(point, 4326) not null,
  radius_km int not null default 10 check (radius_km between 1 and 200),
  alert_enabled boolean not null default true,
  last_alerted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pedidos, conversas e mensagens
-- ---------------------------------------------------------------------------
create table public.adoption_requests (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  adopter_id uuid not null references public.profiles (id) on delete cascade,
  status public.request_status not null default 'sent',
  answers jsonb not null default '{}'::jsonb,
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index adoption_requests_open_uniq on public.adoption_requests (animal_id, adopter_id)
  where status not in ('rejected', 'cancelled');
create index adoption_requests_ngo_idx on public.adoption_requests (ngo_id, status);
create index adoption_requests_adopter_idx on public.adoption_requests (adopter_id);
create trigger adoption_requests_updated_at before update on public.adoption_requests
  for each row execute function public.set_updated_at();

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  adopter_id uuid not null references public.profiles (id) on delete cascade,
  assigned_member_id uuid references public.profiles (id) on delete set null,
  last_message_at timestamptz,
  blocked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (animal_id, adopter_id)
);
create index conversations_ngo_idx on public.conversations (ngo_id, last_message_at desc);
create index conversations_adopter_idx on public.conversations (adopter_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind public.message_kind not null default 'text',
  body text check (char_length(body) <= 4000),
  attachment_path text,
  visit_at timestamptz,
  visit_place text,
  visit_confirmed_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create or replace function public.messages_touch_conversation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end $$;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.messages_touch_conversation();

-- ---------------------------------------------------------------------------
-- Adoções, check-ins, avaliações, denúncias
-- ---------------------------------------------------------------------------
create table public.adoptions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.adoption_requests (id) on delete restrict,
  animal_id uuid not null references public.animals (id) on delete restrict,
  ngo_id uuid not null references public.ngos (id) on delete restrict,
  adopter_id uuid not null references public.profiles (id) on delete restrict,
  adopted_at timestamptz not null default now(),
  term_version text not null default 'padrao-v1',
  term_accepted_at timestamptz,
  status public.adoption_status not null default 'active',
  returned_at timestamptz,
  return_reason text
);
create index adoptions_ngo_idx on public.adoptions (ngo_id);
create index adoptions_adopter_idx on public.adoptions (adopter_id);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null references public.adoptions (id) on delete cascade,
  due_day int not null check (due_day in (7, 30, 90, 180)),
  due_at timestamptz not null,
  status public.checkin_status not null default 'pending',
  answers jsonb,
  photo_paths text[] not null default '{}',
  needs_help boolean not null default false,
  answered_at timestamptz,
  ngo_followed_up_at timestamptz,
  unique (adoption_id, due_day)
);
create index checkins_due_idx on public.checkins (status, due_at);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null unique references public.adoptions (id) on delete cascade,
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  adopter_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);
create index reviews_ngo_idx on public.reviews (ngo_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('animal', 'ngo', 'message', 'review', 'user')),
  target_id uuid not null,
  reason text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
