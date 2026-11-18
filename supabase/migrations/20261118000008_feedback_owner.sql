-- Ajustes pedidos pelo dono (18/11):
-- 1) Instagram da ONG
-- 2) A ONG vê o CELULAR do candidato já no pedido (antes só depois de aprovar). Endereço completo continua só após aprovar.
-- 3) O adotante continua vendo os animais que pediu/adotou mesmo depois de saírem da vitrine (status adopted/archived).

-- 1) Instagram
alter table public.ngos add column if not exists instagram text
  check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');
grant update (instagram) on public.ngos to authenticated;

-- 2) Resumo do candidato com celular
drop function if exists public.get_candidate_summary(uuid);
create function public.get_candidate_summary(p_request_id uuid)
returns table (
  adopter_id uuid, full_name text, neighborhood text, city text, distance_km numeric,
  home_type public.home_type, has_yard boolean, has_children boolean, other_pets text,
  cpf_verified boolean, phone_verified boolean, phone text
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
      pp.cpf_verified_at is not null, pp.phone_verified_at is not null, pp.phone
    from public.profiles p
    join public.profile_private pp on pp.id = p.id
    join public.ngos n on n.id = r.ngo_id
    where p.id = r.adopter_id;
end $$;
revoke execute on function public.get_candidate_summary(uuid) from anon, public;
grant execute on function public.get_candidate_summary(uuid) to authenticated;

-- 3) Animais que a pessoa pediu ou adotou continuam visíveis para ela
create or replace function public.is_my_requested_animal(p_animal_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.adoption_requests where animal_id = p_animal_id and adopter_id = auth.uid());
$$;

drop policy if exists animals_select on public.animals;
create policy animals_select on public.animals for select to anon, authenticated
  using (status in ('available', 'reserved') or public.is_ngo_member(ngo_id) or public.is_admin()
         or public.is_my_requested_animal(id));
