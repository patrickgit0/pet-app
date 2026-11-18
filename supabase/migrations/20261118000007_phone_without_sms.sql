-- Sem provedor de SMS: o celular deixa de ser verificado por código e passa a ser só VALIDADO
-- (formato de celular brasileiro: +55, DDD válido, 9 dígitos começando com 9). A ONG vê "celular informado".
-- phone_verified_at continua existindo para quando houver SMS (fica preenchido só se o Auth confirmou o número).
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
  if coalesce(p_phone, '') !~ '^\+55[1-9][1-9]9[0-9]{8}$' then raise exception 'INVALID_PHONE'; end if;
  if v_cep !~ '^[0-9]{8}$' then raise exception 'INVALID_CEP'; end if;
  if coalesce(trim(p_street), '') = '' then raise exception 'STREET_REQUIRED'; end if;
  if not coalesce(p_lgpd_consent, false) then raise exception 'LGPD_CONSENT_REQUIRED'; end if;

  select case when '+' || u.phone = p_phone then u.phone_confirmed_at end into v_phone_verified from auth.users u where u.id = v_uid;

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
    profile_completed_at = coalesce(profile_completed_at, now())
  where id = v_uid;
end $$;

-- Perfil completo = CPF + celular informado (válido) + endereço + moradia
create or replace function public.is_profile_complete(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.profile_private pp on pp.id = p.id
    where p.id = p_uid
      and pp.cpf_verified_at is not null
      and pp.phone is not null
      and pp.cep is not null and pp.street is not null
      and p.home_type is not null
  );
$$;
