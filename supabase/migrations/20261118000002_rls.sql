-- Adotaí — Row Level Security
-- Princípio: tudo fechado por padrão; cada tabela abre só o necessário.

-- ---------------------------------------------------------------------------
-- Helpers (security definer para evitar recursão de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_ngo_member(p_ngo_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ngo_members where ngo_id = p_ngo_id and user_id = auth.uid());
$$;

create or replace function public.is_ngo_owner(p_ngo_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ngo_members where ngo_id = p_ngo_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Candidato que fez pedido ou conversa com a ONG (para a ONG poder ver o perfil público dele)
create or replace function public.is_candidate_of_my_ngo(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations c
    join public.ngo_members m on m.ngo_id = c.ngo_id and m.user_id = auth.uid()
    where c.adopter_id = p_profile_id
  ) or exists (
    select 1 from public.adoption_requests r
    join public.ngo_members m on m.ngo_id = r.ngo_id and m.user_id = auth.uid()
    where r.adopter_id = p_profile_id
  );
$$;

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and (c.adopter_id = auth.uid() or public.is_ngo_member(c.ngo_id))
  );
$$;

-- ---------------------------------------------------------------------------
-- Ativar RLS em tudo
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.ngos enable row level security;
alter table public.ngo_members enable row level security;
alter table public.animals enable row level security;
alter table public.animal_photos enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;
alter table public.adoption_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.adoptions enable row level security;
alter table public.checkins enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_candidate_of_my_ngo(id) or public.is_admin());

create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Usuário não pode mudar o próprio papel nem marcar o perfil como completo na mão.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, home_type, has_yard, has_children, other_pets, routine_notes)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- profile_private — SÓ o próprio usuário. A ONG nunca lê esta tabela;
-- contato pós-aprovação sai por get_adopter_contact().
-- ---------------------------------------------------------------------------
create policy profile_private_select on public.profile_private for select to authenticated
  using (id = auth.uid());
-- Escrita só via complete_profile() (valida CPF, CEP etc.)
revoke insert, update, delete on public.profile_private from authenticated, anon;

-- ---------------------------------------------------------------------------
-- ngos — leitura pública; escrita pelos donos; verificação só admin
-- ---------------------------------------------------------------------------
create policy ngos_select on public.ngos for select to anon, authenticated using (true);

create policy ngos_update on public.ngos for update to authenticated
  using (public.is_ngo_owner(id) or public.is_admin())
  with check (public.is_ngo_owner(id) or public.is_admin());

revoke update on public.ngos from authenticated;
grant update (name, description, email, phone, pix_key, logo_url, address_text, neighborhood, city, state, location)
  on public.ngos to authenticated;
-- Criação de ONG via create_ngo(); verified_at e métricas só por funções/admin.

-- ---------------------------------------------------------------------------
-- ngo_members
-- ---------------------------------------------------------------------------
create policy ngo_members_select on public.ngo_members for select to authenticated
  using (user_id = auth.uid() or public.is_ngo_member(ngo_id) or public.is_admin());
create policy ngo_members_insert on public.ngo_members for insert to authenticated
  with check (public.is_ngo_owner(ngo_id));
create policy ngo_members_delete on public.ngo_members for delete to authenticated
  using (public.is_ngo_owner(ngo_id) and user_id <> auth.uid());

-- ---------------------------------------------------------------------------
-- animals — disponíveis/reservados são públicos; membros veem e editam os da ONG
-- ---------------------------------------------------------------------------
create policy animals_select on public.animals for select to anon, authenticated
  using (status in ('available', 'reserved') or public.is_ngo_member(ngo_id) or public.is_admin());
create policy animals_insert on public.animals for insert to authenticated
  with check (public.is_ngo_member(ngo_id));
create policy animals_update on public.animals for update to authenticated
  using (public.is_ngo_member(ngo_id)) with check (public.is_ngo_member(ngo_id));
create policy animals_delete on public.animals for delete to authenticated
  using (public.is_ngo_member(ngo_id) and status = 'draft');

-- ---------------------------------------------------------------------------
-- animal_photos
-- ---------------------------------------------------------------------------
create policy animal_photos_select on public.animal_photos for select to anon, authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id));  -- herda RLS de animals
create policy animal_photos_write on public.animal_photos for all to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and public.is_ngo_member(a.ngo_id)))
  with check (exists (select 1 from public.animals a where a.id = animal_id and public.is_ngo_member(a.ngo_id)));

-- ---------------------------------------------------------------------------
-- favorites / saved_searches — só o dono
-- ---------------------------------------------------------------------------
create policy favorites_own on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_searches_own on public.saved_searches for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- adoption_requests — leitura por adotante e ONG; criação via request_adoption();
-- mudança de status pela ONG via update (colunas limitadas)
-- ---------------------------------------------------------------------------
create policy adoption_requests_select on public.adoption_requests for select to authenticated
  using (adopter_id = auth.uid() or public.is_ngo_member(ngo_id) or public.is_admin());
create policy adoption_requests_update on public.adoption_requests for update to authenticated
  using (public.is_ngo_member(ngo_id)) with check (public.is_ngo_member(ngo_id));
revoke insert, update, delete on public.adoption_requests from authenticated, anon;
grant update (status, rejection_reason) on public.adoption_requests to authenticated;

-- ---------------------------------------------------------------------------
-- conversations / messages
-- ---------------------------------------------------------------------------
create policy conversations_select on public.conversations for select to authenticated
  using (adopter_id = auth.uid() or public.is_ngo_member(ngo_id) or public.is_admin());
create policy conversations_update on public.conversations for update to authenticated
  using (adopter_id = auth.uid() or public.is_ngo_member(ngo_id));
revoke insert, update, delete on public.conversations from authenticated, anon;
grant update (assigned_member_id, blocked_at) on public.conversations to authenticated;
-- Criação via start_conversation() — só o adotante inicia.

create policy messages_select on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id) or public.is_admin());
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
    and not exists (select 1 from public.conversations c where c.id = conversation_id and c.blocked_at is not null)
  );
create policy messages_update on public.messages for update to authenticated
  using (public.is_conversation_participant(conversation_id));
revoke update, delete on public.messages from authenticated, anon;
grant update (read_at, visit_confirmed_at) on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- adoptions / checkins / reviews / reports
-- ---------------------------------------------------------------------------
create policy adoptions_select on public.adoptions for select to authenticated
  using (adopter_id = auth.uid() or public.is_ngo_member(ngo_id) or public.is_admin());
revoke insert, update, delete on public.adoptions from authenticated, anon;

create policy checkins_select on public.checkins for select to authenticated
  using (exists (
    select 1 from public.adoptions a
    where a.id = adoption_id and (a.adopter_id = auth.uid() or public.is_ngo_member(a.ngo_id) or public.is_admin())
  ));
revoke insert, update, delete on public.checkins from authenticated, anon;

create policy reviews_select on public.reviews for select to anon, authenticated
  using (hidden_at is null or adopter_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.reviews from authenticated, anon;

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
