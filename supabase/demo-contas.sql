-- Contas FICTÍCIAS de demonstração em produção: 1 ONG com animais e 1 adotante com histórico completo
-- (conversas, pedido com visita marcada, adoção concluída com check-ins e avaliação, favoritos).
-- Uso: { echo "set demo.senha = '<senha>';"; cat supabase/demo-contas.sql; } | psql "$DB"
-- Remover: delete from auth.users where email in ('ong-demo@adotai.dev','adotante-demo@adotai.dev');
--          delete from public.ngos where slug = 'amigos-de-quatro-patas';  (rodar antes do delete de users)
do $$
declare
  v_ngo_user uuid := gen_random_uuid();
  v_adopter uuid := gen_random_uuid();
  v_ngo uuid := gen_random_uuid();
  v_bidu uuid; v_kiara uuid; v_pacoca uuid;
  v_req uuid; v_adoption uuid; v_conv uuid;
begin
  if exists (select 1 from auth.users where email = 'ong-demo@adotai.dev') then
    raise notice 'Contas de demonstração já existem';
    return;
  end if;

  -- Usuários (e-mail já confirmado)
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, phone, phone_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
    extensions.crypt(current_setting('demo.senha'), extensions.gen_salt('bf')), now() - interval '60 days', u.phone,
    case when u.phone is not null then now() - interval '50 days' end,
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.name),
    now() - interval '60 days', now(), '', '', '', ''
  from (values (v_ngo_user, 'ong-demo@adotai.dev', 'Carlos Andrade', null::text),
               (v_adopter, 'adotante-demo@adotai.dev', 'Juliana Martins', '5516988880001')) as u(id, email, name, phone);
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
  from auth.users where id in (v_ngo_user, v_adopter);
  update public.profiles set created_at = now() - interval '60 days' where id in (v_ngo_user, v_adopter);

  -- Adotante com perfil completo (CPF de teste válido)
  update public.profile_private set cpf = '38492017597', cpf_verified_at = now() - interval '50 days',
    phone = '+5516988880001', phone_verified_at = now() - interval '50 days', cep = '14401000',
    street = 'Rua Fictícia, 250', complement = 'Casa 2', lgpd_consent_at = now() - interval '50 days'
  where id = v_adopter;
  update public.profiles set neighborhood = 'Jardim Consolação', city = 'Franca', state = 'SP',
    location = extensions.st_setsrid(extensions.st_makepoint(-47.3905, -20.5561), 4326)::extensions.geography,
    home_type = 'house', has_yard = true, has_children = true, other_pets = '1 gata castrada',
    routine_notes = 'Trabalho em casa três dias por semana.', profile_completed_at = now() - interval '50 days'
  where id = v_adopter;

  -- ONG
  insert into public.ngos (id, name, slug, cnpj, description, email, phone, pix_key, city, state, neighborhood, address_text, location, verified_at, created_at)
  values (v_ngo, 'Amigos de Quatro Patas', 'amigos-de-quatro-patas', '45997418000153',
    'ONG fictícia de demonstração do Vira Lar. Resgatamos, castramos e acompanhamos cada adoção.',
    'ong-demo@adotai.dev', '+5516999990001', 'ong-demo@adotai.dev', 'Franca', 'SP', 'Cidade Nova', 'Cidade Nova, Franca',
    extensions.st_setsrid(extensions.st_makepoint(-47.3755, -20.5561), 4326)::extensions.geography, now() - interval '58 days', now() - interval '60 days');
  insert into public.ngo_members (ngo_id, user_id, role) values (v_ngo, v_ngo_user, 'owner');
  update public.profiles set role = 'ngo_member' where id = v_ngo_user;

  -- Animais
  insert into public.animals (ngo_id, name, species, sex, size, birth_date_estimate, breed, description, energy,
    neutered, vaccinated, dewormed, good_with_kids, good_with_dogs, good_with_cats, good_for_apartment, special_needs, status, published_at, created_at, location)
  select v_ngo, a.name, a.species::public.species, a.sex::public.animal_sex, a.size::public.animal_size,
    (current_date - make_interval(months => a.months))::date, a.breed, a.descr || ' (Anúncio de exemplo.)', a.energy::public.energy_level,
    a.neutered, true, true, a.kids, a.dogs, a.cats, a.apt, a.special, a.status::public.animal_status,
    now() - make_interval(days => a.days), now() - make_interval(days => a.days),
    extensions.st_setsrid(extensions.st_makepoint(a.lng, a.lat), 4326)::extensions.geography
  from (values
    ('Bidu',    'dog', 'male',   'medium', 36, 'SRD',            'Companheiro e tranquilo, ótimo com crianças.', 'medium', true, true,  true,  null,  true,  null, 'adopted',   55, -47.3775, -20.5541),
    ('Kiara',   'dog', 'female', 'large',  24, 'SRD',            'Energia de sobra e muito amorosa. Ideal para casa com quintal.', 'high', true, true,  true,  false, false, null, 'available', 30, -47.3725, -20.5591),
    ('Paçoca',  'dog', 'male',   'small',  10, 'SRD',            'Filhote caramelo, esperto e brincalhão.', 'high', true, true,  true,  true,  true,  null, 'available', 12, -47.3805, -20.5511),
    ('Duque',   'dog', 'male',   'large',  60, 'Labrador (mix)', 'Calmo, obediente e adora água.', 'medium', true, true,  true,  null,  false, null, 'available', 40, -47.3685, -20.5571),
    ('Lola',    'dog', 'female', 'small',  84, 'Poodle (mix)',   'Idosa carinhosa, ideal para apartamento.', 'low', true, true,  false, true,  true,  'Ração para idosos', 'available', 65, -47.3855, -20.5611),
    ('Sushi',   'cat', 'female', 'small',  14, 'SRD',            'Gata branca e preta, curiosa e sociável.', 'medium', true, true,  false, true,  true,  null, 'available', 8,  -47.3785, -20.5581),
    ('Tom',     'cat', 'male',   'small',  48, 'SRD',            'Gato cinza, independente e muito limpo.', 'low', true, true,  false, true,  true,  null, 'available', 22, -47.3745, -20.5531),
    ('Pantera', 'cat', 'female', 'small',   6, 'SRD',            'Filhote preta, brincalhona. Castração agendada.', 'high', false, true, true,  true,  true,  null, 'available', 4,  -47.3765, -20.5621)
  ) as a(name, species, sex, size, months, breed, descr, energy, neutered, kids, dogs, cats, apt, special, status, days, lng, lat);

  select id into v_bidu from public.animals where ngo_id = v_ngo and name = 'Bidu';
  select id into v_kiara from public.animals where ngo_id = v_ngo and name = 'Kiara';
  select id into v_pacoca from public.animals where ngo_id = v_ngo and name = 'Paçoca';

  -- 1) Adoção concluída do Bidu (há 40 dias), com conversa, check-ins respondidos e avaliação
  insert into public.conversations (animal_id, ngo_id, adopter_id, created_at) values (v_bidu, v_ngo, v_adopter, now() - interval '50 days') returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, kind, body, created_at, read_at) values
    (v_conv, v_adopter,  'text', 'Oi! O Bidu ainda está disponível? Tenho quintal e duas crianças.', now() - interval '50 days', now() - interval '50 days'),
    (v_conv, v_ngo_user, 'text', 'Oi, Juliana! Está sim, e ele adora crianças. Quer marcar uma visita?', now() - interval '50 days' + interval '25 minutes', now() - interval '50 days'),
    (v_conv, v_ngo_user, 'text', 'Como o Bidu está se adaptando? Manda uma foto quando puder!', now() - interval '20 days', now() - interval '20 days'),
    (v_conv, v_adopter,  'text', 'Está ótimo! Já dorme no tapete da sala e brinca com as crianças o dia todo.', now() - interval '20 days' + interval '2 hours', now() - interval '19 days');
  insert into public.adoption_requests (animal_id, ngo_id, adopter_id, status, approved_at, created_at, answers)
  values (v_bidu, v_ngo, v_adopter, 'approved', now() - interval '42 days', now() - interval '49 days', '{"motivo":"Queremos um companheiro para as crianças"}')
  returning id into v_req;
  insert into public.adoptions (request_id, animal_id, ngo_id, adopter_id, adopted_at, term_accepted_at)
  values (v_req, v_bidu, v_ngo, v_adopter, now() - interval '40 days', now() - interval '40 days') returning id into v_adoption;
  insert into public.checkins (adoption_id, due_day, due_at, status, answered_at, answers, ngo_followed_up_at) values
    (v_adoption, 7,  now() - interval '33 days', 'answered', now() - interval '33 days', '{"adaptacao":"boa","comentario":"Já se acostumou com a casa."}', now() - interval '32 days'),
    (v_adoption, 30, now() - interval '10 days', 'answered', now() - interval '10 days', '{"adaptacao":"ótima","comentario":"Faz parte da família."}', now() - interval '9 days');
  insert into public.reviews (adoption_id, ngo_id, adopter_id, stars, comment, created_at)
  values (v_adoption, v_ngo, v_adopter, 5, 'Equipe muito atenciosa, acompanhou tudo depois da adoção.', now() - interval '9 days');

  -- 2) Pedido em andamento da Kiara, com visita marcada
  insert into public.conversations (animal_id, ngo_id, adopter_id, created_at) values (v_kiara, v_ngo, v_adopter, now() - interval '3 days') returning id into v_conv;
  insert into public.adoption_requests (animal_id, ngo_id, adopter_id, status, created_at, answers)
  values (v_kiara, v_ngo, v_adopter, 'visit_scheduled', now() - interval '3 days', '{"motivo":"Companhia para o Bidu"}');
  insert into public.messages (conversation_id, sender_id, kind, body, visit_at, visit_place, visit_confirmed_at, created_at, read_at) values
    (v_conv, v_adopter,  'text', 'Oi! Gostaria de conhecer a Kiara, acho que ela e o Bidu iam se dar bem.', null, null, null, now() - interval '3 days', now() - interval '3 days'),
    (v_conv, v_ngo_user, 'text', 'Que legal! Ela é bem agitada, combina com quintal. Podemos marcar uma visita com o Bidu junto.', null, null, null, now() - interval '3 days' + interval '40 minutes', now() - interval '3 days'),
    (v_conv, v_ngo_user, 'visit_proposal', 'Proposta de visita', date_trunc('day', now()) + interval '2 days 10 hours', 'Sede da ONG — Cidade Nova', now() - interval '2 days', now() - interval '2 days', now() - interval '2 days'),
    (v_conv, v_adopter,  'text', 'Combinado, estaremos lá!', null, null, null, now() - interval '2 days' + interval '1 hour', null);

  -- 3) Conversa sobre o Paçoca (só dúvidas, sem pedido)
  insert into public.conversations (animal_id, ngo_id, adopter_id, created_at) values (v_pacoca, v_ngo, v_adopter, now() - interval '1 day') returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, kind, body, created_at, read_at) values
    (v_conv, v_adopter, 'text', 'O Paçoca já é castrado? Vai crescer muito?', now() - interval '1 day', null);

  -- Favoritos (inclui um animal da ONG Exemplo, se existir)
  insert into public.favorites (user_id, animal_id)
  select v_adopter, id from public.animals where (ngo_id = v_ngo and name in ('Kiara', 'Paçoca', 'Sushi')) or name = 'Luna' and status = 'available'
  on conflict do nothing;

  perform public.recompute_ngo_rating(v_ngo);
end $$;
