-- Vira Lar — funções de negócio (RPC)
-- Toda regra sensível passa por aqui, não pelo cliente.

-- ---------------------------------------------------------------------------
-- Validação de CPF (dígitos verificadores)
-- ---------------------------------------------------------------------------
create or replace function public.is_valid_cpf(p_cpf text)
returns boolean language plpgsql immutable as $$
declare
  d int[];
  s int;
  r int;
  i int;
begin
  if p_cpf is null or p_cpf !~ '^[0-9]{11}$' or p_cpf ~ '^(.)\1{10}$' then
    return false;
  end if;
  d := array(select substr(p_cpf, g, 1)::int from generate_series(1, 11) g);
  s := 0;
  for i in 1..9 loop s := s + d[i] * (11 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  if r <> d[10] then return false; end if;
  s := 0;
  for i in 1..10 loop s := s + d[i] * (12 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  return r = d[11];
end $$;

-- ---------------------------------------------------------------------------
-- Etapa 2: completar perfil
-- Celular é verificado por SMS no Supabase Auth (phone_confirmed_at); aqui
-- copiamos o estado. CEP já chega resolvido pelo cliente (ViaCEP) com cidade/UF/bairro.
-- ---------------------------------------------------------------------------
create or replace function public.complete_profile(
  p_cpf text,
  p_phone text,
  p_cep text,
  p_street text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_state text,
  p_lat double precision,
  p_lng double precision,
  p_home_type public.home_type,
  p_has_yard boolean,
  p_has_children boolean,
  p_other_pets text,
  p_lgpd_consent boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_cep text := regexp_replace(coalesce(p_cep, ''), '\D', '', 'g');
  v_phone_verified timestamptz;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_valid_cpf(v_cpf) then raise exception 'INVALID_CPF'; end if;
  if exists (select 1 from public.profile_private where cpf = v_cpf and id <> v_uid) then
    raise exception 'CPF_IN_USE';
  end if;
  if v_cep !~ '^[0-9]{8}$' then raise exception 'INVALID_CEP'; end if;
  if coalesce(trim(p_street), '') = '' then raise exception 'STREET_REQUIRED'; end if;
  if not coalesce(p_lgpd_consent, false) then raise exception 'LGPD_CONSENT_REQUIRED'; end if;

  select phone_confirmed_at into v_phone_verified from auth.users where id = v_uid;

  update public.profile_private set
    cpf = v_cpf,
    cpf_verified_at = now(),
    phone = p_phone,
    phone_verified_at = v_phone_verified,
    cep = v_cep,
    street = trim(p_street),
    complement = nullif(trim(coalesce(p_complement, '')), ''),
    lgpd_consent_at = coalesce(lgpd_consent_at, now())
  where id = v_uid;

  update public.profiles set
    neighborhood = p_neighborhood,
    city = p_city,
    state = upper(p_state),
    location = case when p_lat is not null and p_lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography end,
    home_type = p_home_type,
    has_yard = p_has_yard,
    has_children = p_has_children,
    other_pets = p_other_pets,
    profile_completed_at = case when v_phone_verified is not null then now() end
  where id = v_uid;
end $$;

-- Perfil completo = CPF + celular verificado + endereço + moradia
create or replace function public.is_profile_complete(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.profile_private pp on pp.id = p.id
    where p.id = p_uid
      and pp.cpf_verified_at is not null
      and pp.phone_verified_at is not null
      and pp.cep is not null and pp.street is not null
      and p.home_type is not null
  );
$$;

-- Localização do próprio usuário (centro padrão da busca)
create or replace function public.get_my_location()
returns table (lat double precision, lng double precision)
language sql stable security definer set search_path = '' as $$
  select extensions.st_y(location::extensions.geometry), extensions.st_x(location::extensions.geometry)
  from public.profiles where id = auth.uid() and location is not null;
$$;

-- Chamada depois que o Supabase Auth confirma o celular por SMS
create or replace function public.sync_phone_verification()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
  v_at timestamptz;
begin
  select '+' || phone, phone_confirmed_at into v_phone, v_at from auth.users where id = v_uid;
  if v_at is null then return false; end if;
  update public.profile_private set phone = v_phone, phone_verified_at = v_at where id = v_uid;
  update public.profiles set profile_completed_at = now()
    where id = v_uid and profile_completed_at is null and public.is_profile_complete(v_uid);
  return true;
end $$;

-- ---------------------------------------------------------------------------
-- ONG: criação (quem cria vira owner; verificação fica pendente para o admin)
-- ---------------------------------------------------------------------------
create or replace function public.create_ngo(
  p_name text, p_slug text, p_cnpj text, p_city text, p_state text,
  p_lat double precision, p_lng double precision,
  p_neighborhood text default null, p_address_text text default null,
  p_description text default null, p_email text default null, p_phone text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  insert into public.ngos (name, slug, cnpj, city, state, location, neighborhood, address_text, description, email, phone)
  values (p_name, lower(p_slug), regexp_replace(p_cnpj, '\D', '', 'g'), p_city, upper(p_state),
          extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
          p_neighborhood, p_address_text, p_description, p_email, p_phone)
  returning id into v_id;
  insert into public.ngo_members (ngo_id, user_id, role) values (v_id, v_uid, 'owner');
  update public.profiles set role = 'ngo_member' where id = v_uid and role = 'adopter';
  return v_id;
end $$;

create or replace function public.admin_verify_ngo(p_ngo_id uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.ngos set verified_at = case when p_verified then now() end where id = p_ngo_id;
end $$;

-- ---------------------------------------------------------------------------
-- Busca de animais por raio, com filtros e ordenação
-- sort: recommended | distance | rating | recent | oldest
-- ---------------------------------------------------------------------------
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
    f.id, f.name, f.species, f.sex, f.size, f.age_m, f.breed, f.neutered, f.vaccinated, f.good_with_kids,
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
-- Chat: só o adotante inicia; uma conversa por (animal, adotante)
-- ---------------------------------------------------------------------------
create or replace function public.start_conversation(p_animal_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_ngo uuid;
  v_id uuid;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select ngo_id into v_ngo from public.animals where id = p_animal_id and status in ('available', 'reserved');
  if v_ngo is null then raise exception 'ANIMAL_NOT_AVAILABLE'; end if;
  if public.is_ngo_member(v_ngo) then raise exception 'NGO_CANNOT_START_CONVERSATION'; end if;

  insert into public.conversations (animal_id, ngo_id, adopter_id)
  values (p_animal_id, v_ngo, v_uid)
  on conflict (animal_id, adopter_id) do update set animal_id = excluded.animal_id
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Pedido de adoção: exige perfil completo (etapa 2)
-- ---------------------------------------------------------------------------
create or replace function public.request_adoption(p_animal_id uuid, p_answers jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_ngo uuid;
  v_id uuid;
  v_conv uuid;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_profile_complete(v_uid) then raise exception 'PROFILE_INCOMPLETE'; end if;
  select ngo_id into v_ngo from public.animals where id = p_animal_id and status = 'available';
  if v_ngo is null then raise exception 'ANIMAL_NOT_AVAILABLE'; end if;
  if public.is_ngo_member(v_ngo) then raise exception 'FORBIDDEN'; end if;

  select id into v_id from public.adoption_requests
    where animal_id = p_animal_id and adopter_id = v_uid and status not in ('rejected', 'cancelled');
  if v_id is not null then return v_id; end if;

  insert into public.adoption_requests (animal_id, ngo_id, adopter_id, answers)
  values (p_animal_id, v_ngo, v_uid, coalesce(p_answers, '{}'::jsonb))
  returning id into v_id;

  v_conv := public.start_conversation(p_animal_id);
  insert into public.messages (conversation_id, sender_id, kind, body)
  values (v_conv, v_uid, 'system', 'Pedido de adoção enviado.');
  return v_id;
end $$;

create or replace function public.cancel_adoption_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.adoption_requests set status = 'cancelled'
  where id = p_request_id and adopter_id = auth.uid() and status in ('sent', 'reviewing', 'visit_scheduled');
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- ONG muda o status (aprovar/recusar/visita). Aprovar marca approved_at e reserva o animal.
create or replace function public.set_request_status(
  p_request_id uuid, p_status public.request_status, p_reason text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.adoption_requests;
begin
  select * into r from public.adoption_requests where id = p_request_id;
  if r.id is null or not public.is_ngo_member(r.ngo_id) then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('reviewing', 'visit_scheduled', 'approved', 'rejected') then raise exception 'INVALID_STATUS'; end if;
  if r.status in ('rejected', 'cancelled') then raise exception 'REQUEST_CLOSED'; end if;

  update public.adoption_requests set
    status = p_status,
    rejection_reason = case when p_status = 'rejected' then p_reason else rejection_reason end,
    approved_at = case when p_status = 'approved' then now() else approved_at end
  where id = p_request_id;

  if p_status = 'approved' then
    update public.animals set status = 'reserved' where id = r.animal_id and status = 'available';
  end if;
end $$;

-- Contato do adotante: só para a ONG e só depois de aprovado. CPF NUNCA sai.
create or replace function public.get_adopter_contact(p_request_id uuid)
returns table (full_name text, phone text, cep text, street text, complement text, neighborhood text, city text, state text)
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.adoption_requests;
begin
  select * into r from public.adoption_requests where id = p_request_id;
  if r.id is null or not public.is_ngo_member(r.ngo_id) then raise exception 'FORBIDDEN'; end if;
  if r.status <> 'approved' then raise exception 'NOT_APPROVED'; end if;
  return query
    select p.full_name, pp.phone, pp.cep::text, pp.street, pp.complement, p.neighborhood, p.city, p.state::text
    from public.profiles p join public.profile_private pp on pp.id = p.id
    where p.id = r.adopter_id;
end $$;

-- Resumo do candidato para a ONG (sem dados sensíveis)
create or replace function public.get_candidate_summary(p_request_id uuid)
returns table (
  adopter_id uuid, full_name text, neighborhood text, city text, distance_km numeric,
  home_type public.home_type, has_yard boolean, has_children boolean, other_pets text,
  cpf_verified boolean, phone_verified boolean
) language plpgsql stable security definer set search_path = '' as $$
declare
  r public.adoption_requests;
begin
  select * into r from public.adoption_requests where id = p_request_id;
  if r.id is null or not public.is_ngo_member(r.ngo_id) then raise exception 'FORBIDDEN'; end if;
  return query
    select p.id, p.full_name, p.neighborhood, p.city,
      round((extensions.st_distance(p.location, n.location) / 1000.0)::numeric, 1),
      p.home_type, p.has_yard, p.has_children, p.other_pets,
      pp.cpf_verified_at is not null, pp.phone_verified_at is not null
    from public.profiles p
    join public.profile_private pp on pp.id = p.id
    join public.ngos n on n.id = r.ngo_id
    where p.id = r.adopter_id;
end $$;

-- ---------------------------------------------------------------------------
-- Adoção concluída: cria adoção, marca animal, agenda check-ins (MVP: 7 e 30)
-- ---------------------------------------------------------------------------
create or replace function public.complete_adoption(p_request_id uuid, p_checkin_days int[] default array[7, 30])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  r public.adoption_requests;
  v_id uuid;
  d int;
begin
  select * into r from public.adoption_requests where id = p_request_id;
  if r.id is null or not public.is_ngo_member(r.ngo_id) then raise exception 'FORBIDDEN'; end if;
  if r.status <> 'approved' then raise exception 'NOT_APPROVED'; end if;

  insert into public.adoptions (request_id, animal_id, ngo_id, adopter_id)
  values (r.id, r.animal_id, r.ngo_id, r.adopter_id)
  returning id into v_id;

  update public.animals set status = 'adopted' where id = r.animal_id;
  -- Fecha os outros pedidos abertos desse animal
  update public.adoption_requests set status = 'rejected', rejection_reason = 'Animal adotado por outra família'
    where animal_id = r.animal_id and id <> r.id and status in ('sent', 'reviewing', 'visit_scheduled');

  foreach d in array p_checkin_days loop
    insert into public.checkins (adoption_id, due_day, due_at) values (v_id, d, now() + make_interval(days => d));
  end loop;

  update public.ngos set completed_adoptions = completed_adoptions + 1 where id = r.ngo_id;
  return v_id;
end $$;

-- Adotante aceita o termo padrão
create or replace function public.accept_adoption_term(p_adoption_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.adoptions set term_accepted_at = now()
  where id = p_adoption_id and adopter_id = auth.uid() and term_accepted_at is null;
end $$;

-- Adotante responde o check-in
create or replace function public.answer_checkin(
  p_checkin_id uuid, p_answers jsonb, p_photo_paths text[] default '{}', p_needs_help boolean default false
) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.checkins c set
    answers = p_answers, photo_paths = coalesce(p_photo_paths, '{}'), needs_help = coalesce(p_needs_help, false),
    status = 'answered', answered_at = now()
  from public.adoptions a
  where c.id = p_checkin_id and a.id = c.adoption_id and a.adopter_id = auth.uid();
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- ONG marca que acompanhou um check-in atrasado ou um pedido de ajuda
create or replace function public.mark_checkin_followed_up(p_checkin_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.checkins c set ngo_followed_up_at = now()
  from public.adoptions a
  where c.id = p_checkin_id and a.id = c.adoption_id and public.is_ngo_member(a.ngo_id);
  if not found then raise exception 'FORBIDDEN'; end if;
end $$;

-- ONG registra devolução
create or replace function public.register_return(p_adoption_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.adoptions;
begin
  select * into a from public.adoptions where id = p_adoption_id;
  if a.id is null or not public.is_ngo_member(a.ngo_id) then raise exception 'FORBIDDEN'; end if;
  update public.adoptions set status = 'returned', returned_at = now(), return_reason = p_reason where id = a.id;
  update public.animals set status = 'draft' where id = a.animal_id;
end $$;

-- Avaliação: só quem adotou, uma por adoção
create or replace function public.review_ngo(p_adoption_id uuid, p_stars int, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.adoptions;
begin
  select * into a from public.adoptions where id = p_adoption_id and adopter_id = auth.uid();
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  insert into public.reviews (adoption_id, ngo_id, adopter_id, stars, comment)
  values (a.id, a.ngo_id, a.adopter_id, p_stars, p_comment);
end $$;

-- ---------------------------------------------------------------------------
-- Ranking da ONG (0–5). Pesos: sucesso 30 · pós-adoção 20 · avaliações 20 ·
-- resposta 15 · transparência 15. Menos de 5 adoções → null ("Nova na plataforma").
-- ---------------------------------------------------------------------------
create or replace function public.recompute_ngo_rating(p_ngo_id uuid)
returns numeric language plpgsql security definer set search_path = '' as $$
declare
  v_completed int;
  v_success numeric;
  v_followup numeric;
  v_reviews numeric;
  v_review_count int;
  v_resp_min numeric;
  v_resp_score numeric;
  v_transp numeric;
  v_rating numeric;
begin
  select count(*) into v_completed from public.adoptions where ngo_id = p_ngo_id;

  -- sucesso: adoções com mais de 90 dias que não foram devolvidas
  select avg(case when status = 'returned' then 0 else 1 end) into v_success
  from public.adoptions where ngo_id = p_ngo_id and adopted_at < now() - interval '90 days';

  -- pós-adoção: check-ins vencidos que foram respondidos
  select avg(case when c.status = 'answered' then 1 else 0 end) into v_followup
  from public.checkins c join public.adoptions a on a.id = c.adoption_id
  where a.ngo_id = p_ngo_id and c.due_at < now();

  select avg(stars) / 5.0, count(*) into v_reviews, v_review_count
  from public.reviews where ngo_id = p_ngo_id and hidden_at is null;

  -- tempo de resposta: mediana entre a 1ª msg do adotante e a 1ª resposta da ONG
  select percentile_cont(0.5) within group (order by extract(epoch from (fr.at - fa.at)) / 60.0)
  into v_resp_min
  from public.conversations cv
  cross join lateral (
    select min(m.created_at) as at from public.messages m
    where m.conversation_id = cv.id and m.sender_id = cv.adopter_id and m.kind <> 'system'
  ) fa
  cross join lateral (
    select min(m.created_at) as at from public.messages m
    where m.conversation_id = cv.id and m.sender_id <> cv.adopter_id and m.created_at > fa.at
  ) fr
  where cv.ngo_id = p_ngo_id and fa.at is not null and fr.at is not null;

  v_resp_score := case when v_resp_min is null then null
                       else greatest(0, least(1, 1 - (v_resp_min - 60) / (1440 - 60))) end;

  -- transparência: anúncios ativos com saúde preenchida, descrição e atualizados em 60 dias
  select avg(case when neutered is not null and vaccinated is not null
                   and char_length(coalesce(description, '')) >= 50
                   and updated_at > now() - interval '60 days' then 1 else 0 end)
  into v_transp
  from public.animals where ngo_id = p_ngo_id and status in ('available', 'reserved');

  if v_completed >= 5 then
    -- critério sem dado ainda usa valor neutro 0,7
    v_rating := 5 * (
      0.30 * coalesce(v_success, 0.7) + 0.20 * coalesce(v_followup, 0.7) + 0.20 * coalesce(v_reviews, 0.7)
      + 0.15 * coalesce(v_resp_score, 0.7) + 0.15 * coalesce(v_transp, 0.7)
    );
  end if;

  update public.ngos set
    rating = round(v_rating, 1),
    rating_count = coalesce(v_review_count, 0),
    completed_adoptions = v_completed,
    median_response_minutes = round(v_resp_min)
  where id = p_ngo_id;
  return round(v_rating, 1);
end $$;
revoke execute on function public.recompute_ngo_rating from anon, authenticated;

-- Tarefa periódica: marca check-ins atrasados e recalcula notas
create or replace function public.run_daily_jobs()
returns void language plpgsql security definer set search_path = '' as $$
declare
  n record;
begin
  update public.checkins set status = 'late'
  where status = 'pending' and due_at < now() - interval '3 days';
  for n in select id from public.ngos loop
    perform public.recompute_ngo_rating(n.id);
  end loop;
end $$;
revoke execute on function public.run_daily_jobs from anon, authenticated;

-- LGPD: exclusão de conta. Sem adoções → apaga tudo. Com adoções → anonimiza
-- (mantém o registro mínimo da adoção para o histórico da ONG).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if exists (select 1 from public.adoptions where adopter_id = v_uid) then
    update public.profile_private set cpf = null, cpf_verified_at = null, phone = null, phone_verified_at = null,
      cep = null, street = null, complement = null where id = v_uid;
    update public.profiles set full_name = 'Conta excluída', avatar_url = null, neighborhood = null, location = null,
      other_pets = null, routine_notes = null where id = v_uid;
    delete from public.favorites where user_id = v_uid;
    delete from public.saved_searches where user_id = v_uid;
    update auth.users set email = 'excluido+' || v_uid || '@adotai.invalid', phone = null,
      encrypted_password = '', banned_until = 'infinity' where id = v_uid;
  else
    delete from auth.users where id = v_uid;
  end if;
end $$;

-- Funções internas não devem ser chamadas por anônimos
revoke execute on function public.complete_profile, public.sync_phone_verification, public.create_ngo,
  public.start_conversation, public.request_adoption, public.cancel_adoption_request, public.set_request_status,
  public.get_adopter_contact, public.get_candidate_summary, public.complete_adoption, public.accept_adoption_term,
  public.answer_checkin, public.register_return, public.review_ngo, public.admin_verify_ngo,
  public.mark_checkin_followed_up, public.get_my_location, public.delete_my_account
  from anon;
