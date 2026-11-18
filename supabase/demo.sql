-- ONG e animais DE EXEMPLO para demonstrar o site em produção (claramente marcados como exemplo).
-- Uso: { echo "set demo.senha = '<senha>';"; cat supabase/demo.sql; } | psql "$DB"   (a senha NÃO fica no repositório)
-- Remover depois: delete from auth.users where email = 'ong-exemplo@adotai.dev'; delete from public.ngos where slug = 'ong-exemplo';
do $$
declare
  v_user uuid := gen_random_uuid();
  v_ngo uuid := gen_random_uuid();
begin
  if exists (select 1 from public.ngos where slug = 'ong-exemplo') then
    raise notice 'ONG de exemplo já existe';
    return;
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_user, 'authenticated', 'authenticated', 'ong-exemplo@adotai.dev',
    extensions.crypt(current_setting('demo.senha'), extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Equipe Exemplo Adotaí"}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_user, v_user::text, jsonb_build_object('sub', v_user::text, 'email', 'ong-exemplo@adotai.dev'), 'email', now(), now(), now());

  insert into public.ngos (id, name, slug, cnpj, description, email, city, state, neighborhood, location, verified_at)
  values (v_ngo, 'ONG Exemplo Adotaí', 'ong-exemplo', '11222333000181',
    'ONG de demonstração do Adotaí. Os animais desta página são exemplos para mostrar como a plataforma funciona.',
    'ong-exemplo@adotai.dev', 'Ribeirão Preto', 'SP', 'Centro',
    extensions.st_setsrid(extensions.st_makepoint(-47.8103, -21.1775), 4326)::extensions.geography, now());
  insert into public.ngo_members (ngo_id, user_id, role) values (v_ngo, v_user, 'owner');
  update public.profiles set role = 'ngo_member' where id = v_user;

  insert into public.animals (ngo_id, name, species, sex, size, birth_date_estimate, breed, description, energy,
    neutered, vaccinated, dewormed, good_with_kids, good_with_dogs, good_with_cats, good_for_apartment, status, published_at, location)
  select v_ngo, a.name, a.species::public.species, a.sex::public.animal_sex, a.size::public.animal_size,
    (current_date - make_interval(months => a.months))::date, a.breed, a.descr || ' (Anúncio de exemplo.)',
    a.energy::public.energy_level, a.neutered, true, true, a.kids, a.dogs, a.cats, a.apt, 'available', now() - make_interval(days => a.days),
    extensions.st_setsrid(extensions.st_makepoint(a.lng, a.lat), 4326)::extensions.geography
  from (values
    ('Pipoca',  'dog', 'female', 'small',  24, 'SRD',      'Carinhosa e adora passear. Fica tranquila sozinha por algumas horas.', 'medium', true,  true,  true,  false, true,  3,  -47.7880, -21.1960),
    ('Thor',    'dog', 'male',   'large',  48, 'SRD',      'Grandão e gentil, precisa de quintal e passeios diários. Já anda na guia.', 'high', true,  true,  false, false, false, 12, -47.7800, -21.1900),
    ('Luna',    'dog', 'female', 'medium', 30, 'SRD',      'Esperta e obediente, conhece comandos básicos.', 'medium', true,  true,  true,  true,  true,  20, -47.8300, -21.1700),
    ('Tufão',   'dog', 'male',   'small',  60, 'Shih-tzu', 'Calmo, adora colo. Perfeito para apartamento.', 'low', true,  true,  true,  false, true,  6,  -47.8250, -21.1750),
    ('Mel',     'dog', 'female', 'small',  96, 'SRD',      'Idosa doce e calma, procura um lar tranquilo.', 'low', true,  true,  true,  true,  true,  45, -47.8330, -21.1620),
    ('Frajola', 'cat', 'male',   'small',  18, 'SRD',      'Gato preto e branco, curioso e carinhoso. Usa caixa de areia.', 'medium', true,  true,  null,  true,  true,  9,  -47.7950, -21.1930),
    ('Nina',    'cat', 'female', 'small',   5, 'SRD',      'Filhote tricolor muito brincalhona.', 'high', false, true,  null,  true,  true,  2,  -47.7830, -21.2010),
    ('Mingau',  'cat', 'male',   'small',  60, 'SRD',      'Gato laranja tranquilo, gosta de janela e sonecas.', 'low', true,  true,  false, true,  true,  30, -47.8200, -21.1780)
  ) as a(name, species, sex, size, months, breed, descr, energy, neutered, kids, dogs, cats, apt, days, lng, lat);
end $$;
