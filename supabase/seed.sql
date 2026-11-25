-- Vira Lar — dados FICTÍCIOS para desenvolvimento local (Franca/SP)
-- Senha de todos os usuários: adotai123

-- ---------------------------------------------------------------------------
-- Usuários
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('adotai123', extensions.gen_salt('bf')), now(),
  u.phone, case when u.phone is not null then now() end,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name), now(), now(), '', '', '', ''
from (values
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'admin@adotai.dev', 'Admin Vira Lar', null::text),
  ('00000000-0000-0000-0000-0000000000b1'::uuid, 'ong1@adotai.dev', 'Ana Ribeiro', null),
  ('00000000-0000-0000-0000-0000000000b2'::uuid, 'ong2@adotai.dev', 'Bruno Carvalho', null),
  ('00000000-0000-0000-0000-0000000000b3'::uuid, 'ong3@adotai.dev', 'Carla Mendes', null),
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'adotante@adotai.dev', 'Mariana Souza', '5516991234567'),
  ('00000000-0000-0000-0000-0000000000c2'::uuid, 'novo@adotai.dev', 'Rafael Teixeira', null)
) as u(id, email, full_name, phone);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email like '%@adotai.dev';

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

-- Adotante com perfil completo (CPF de teste válido 529.982.247-25)
update public.profile_private set
  cpf = '52998224725', cpf_verified_at = now(), phone = '+5516991234567', phone_verified_at = now(),
  cep = '14400490', street = 'Rua Exemplo, 100', complement = 'Apto 12', lgpd_consent_at = now()
where id = '00000000-0000-0000-0000-0000000000c1';
update public.profiles set
  neighborhood = 'Jardim Petráglia', city = 'Franca', state = 'SP',
  location = extensions.st_setsrid(extensions.st_makepoint(-47.4075, -20.5677), 4326)::extensions.geography,
  home_type = 'apartment', has_yard = false, has_children = false, other_pets = 'Nenhum',
  profile_completed_at = now()
where id = '00000000-0000-0000-0000-0000000000c1';

-- ---------------------------------------------------------------------------
-- ONGs (fictícias)
-- ---------------------------------------------------------------------------
insert into public.ngos (id, name, slug, cnpj, description, email, city, state, neighborhood, location, verified_at, pix_key) values
  ('00000000-0000-0000-0000-00000000d001', 'Patas Unidas', 'patas-unidas', '11222333000181',
   'Resgatamos e cuidamos de cães e gatos abandonados em Franca desde 2015.', 'contato@patasunidas.dev',
   'Franca', 'SP', 'Cidade Nova',
   extensions.st_setsrid(extensions.st_makepoint(-47.3760, -20.5566), 4326)::extensions.geography, now(), 'contato@patasunidas.dev'),
  ('00000000-0000-0000-0000-00000000d002', 'Lar do Focinho', 'lar-do-focinho', '22333444000172',
   'Lares temporários para cães e gatos até encontrarem uma família.', 'ola@lardofocinho.dev',
   'Franca', 'SP', 'Estação',
   extensions.st_setsrid(extensions.st_makepoint(-47.4175, -20.5341), 4326)::extensions.geography, now(), null),
  ('00000000-0000-0000-0000-00000000d003', 'Abrigo Esperança', 'abrigo-esperanca', '33444555000163',
   'Abrigo focado em animais idosos e com necessidades especiais.', 'abrigo@esperanca.dev',
   'Franca', 'SP', 'Jardim Paulista',
   extensions.st_setsrid(extensions.st_makepoint(-47.4255, -20.5211), 4326)::extensions.geography, null, null);

insert into public.ngo_members (ngo_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000000b1', 'owner'),
  ('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-0000000000b2', 'owner'),
  ('00000000-0000-0000-0000-00000000d003', '00000000-0000-0000-0000-0000000000b3', 'owner');
update public.profiles set role = 'ngo_member'
  where id in ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b3');

-- ---------------------------------------------------------------------------
-- Animais disponíveis (localizações espalhadas pela cidade)
-- ---------------------------------------------------------------------------
insert into public.animals (
  ngo_id, name, species, sex, size, birth_date_estimate, breed, description, energy,
  neutered, vaccinated, dewormed, good_with_kids, good_with_dogs, good_with_cats, good_for_apartment,
  status, location
)
select
  ('00000000-0000-0000-0000-00000000d00' || a.ngo)::uuid, a.name, a.species::public.species, a.sex::public.animal_sex,
  a.size::public.animal_size, (current_date - make_interval(months => a.months))::date, a.breed, a.descr,
  a.energy::public.energy_level, a.neutered, true, true, a.kids, a.dogs, a.cats, a.apt, 'available',
  extensions.st_setsrid(extensions.st_makepoint(a.lng, a.lat), 4326)::extensions.geography
from (values
  (1, 'Pipoca',  'dog', 'female', 'small',  24, 'SRD', 'Resgatada em março, a Pipoca é carinhosa e adora passear. Fica tranquila sozinha por algumas horas.', 'medium', true,  true,  true,  false, true,  -47.3785, -20.5571),
  (1, 'Bolinha', 'dog', 'male',   'small',  12, 'SRD', 'Filhote crescido, brincalhão e muito sociável com outros cães. Ideal para família ativa.', 'high', true,  true,  true,  null,  true,  -47.3825, -20.5601),
  (1, 'Thor',    'dog', 'male',   'large',  48, 'SRD', 'Grandão e gentil, precisa de casa com quintal e passeios diários. Já sabe andar na guia.', 'high', true,  true,  false, false, false, -47.3705, -20.5511),
  (1, 'Frajola', 'cat', 'male',   'small',  18, 'SRD', 'Gato preto e branco, curioso e carinhoso. Usa caixa de areia e convive bem com crianças.', 'medium', true,  true,  null,  true,  true,  -47.3855, -20.5541),
  (1, 'Nina',    'cat', 'female', 'small',   5, 'SRD', 'Filhote de gata tricolor, muito brincalhona. Será castrada ao completar seis meses.', 'high', false, true,  null,  true,  true,  -47.3735, -20.5621),
  (2, 'Tufão',   'dog', 'male',   'small',  48, 'Shih-tzu', 'Calmo, adora colo e convive bem com outros cães. Perfeito para apartamento.', 'low', true,  true,  true,  false, true,  -47.4155, -20.5361),
  (2, 'Luna',    'dog', 'female', 'medium', 30, 'SRD', 'Esperta e obediente, conhece comandos básicos. Precisa de rotina de passeios.', 'medium', true,  true,  true,  true,  true,  -47.4205, -20.5311),
  (2, 'Mingau',  'cat', 'male',   'small',  60, 'SRD', 'Gato laranja tranquilo, gosta de janela e sonecas longas. Ótimo para quem trabalha fora.', 'low', true,  true,  false, true,  true,  -47.4105, -20.5391),
  (2, 'Amora',   'cat', 'female', 'small',  10, 'SRD', 'Gatinha tímida no começo, mas muito carinhosa depois que confia.', 'medium', true,  false, false, true,  true,  -47.4055, -20.5421),
  (2, 'Rex',     'dog', 'male',   'medium',  8, 'SRD', 'Filhote cheio de energia, já vacinado. Vai crescer até porte médio.', 'high', true,  true,  null,  true,  false, -47.4185, -20.5271),
  (3, 'Mel',     'dog', 'female', 'small',  84, 'SRD', 'Idosa doce e calma, procura um lar tranquilo para passar a melhor fase da vida.', 'low', true,  true,  true,  true,  true,  -47.4235, -20.5231),
  (3, 'Café',    'dog', 'male',   'small', 108, 'SRD', 'Senhorzinho companheiro, enxerga pouco mas se adapta rápido à casa.', 'low', true,  true,  false, true,  true,  -47.4285, -20.5191),
  (3, 'Princesa','cat', 'female', 'small', 96, 'Siamês', 'Gata idosa, carinhosa e silenciosa. Toma ração renal, a ONG orienta.', 'low', true,  true,  true,  true,  true,  -47.4305, -20.5221),
  (3, 'Bento',   'dog', 'male',   'medium', 72, 'SRD', 'Tem três patas e corre como qualquer outro cão. Muito alegre e amoroso.', 'medium', true,  true,  true,  false, false, -47.4225, -20.5171)
) as a(ngo, name, species, sex, size, months, breed, descr, energy, neutered, kids, dogs, cats, apt, lng, lat);

update public.animals set special_needs = 'Ração renal' where name = 'Princesa';
update public.animals set special_needs = 'Amputado (três patas)' where name = 'Bento';
update public.animals set special_needs = 'Baixa visão' where name = 'Café';

-- ---------------------------------------------------------------------------
-- Histórico de adoções da Patas Unidas (para o ranking ter dados)
-- ---------------------------------------------------------------------------
do $$
declare
  i int;
  v_animal uuid;
  v_req uuid;
  v_adoption uuid;
  v_ngo uuid := '00000000-0000-0000-0000-00000000d001';
  v_adopter uuid := '00000000-0000-0000-0000-0000000000c1';
begin
  for i in 1..6 loop
    insert into public.animals (ngo_id, name, species, sex, size, breed, status, neutered, vaccinated, description)
    values (v_ngo, 'Adotado ' || i, 'dog', 'female', 'small', 'SRD', 'adopted', true, true, 'Histórico de adoção (seed).')
    returning id into v_animal;

    insert into public.adoption_requests (animal_id, ngo_id, adopter_id, status, approved_at, created_at)
    values (v_animal, v_ngo, v_adopter, 'approved', now() - interval '120 days', now() - interval '125 days')
    returning id into v_req;

    insert into public.adoptions (request_id, animal_id, ngo_id, adopter_id, adopted_at, term_accepted_at)
    values (v_req, v_animal, v_ngo, v_adopter, now() - interval '120 days', now() - interval '120 days')
    returning id into v_adoption;

    insert into public.checkins (adoption_id, due_day, due_at, status, answered_at, answers)
    values
      (v_adoption, 7, now() - interval '113 days', 'answered', now() - interval '112 days', '{"adaptacao":"boa"}'),
      (v_adoption, 30, now() - interval '90 days', 'answered', now() - interval '89 days', '{"adaptacao":"ótima"}');

    insert into public.reviews (adoption_id, ngo_id, adopter_id, stars, comment)
    values (v_adoption, v_ngo, v_adopter, case when i = 3 then 4 else 5 end, 'Equipe atenciosa do começo ao fim.');
  end loop;
end $$;

-- Uma conversa em andamento e um pedido aberto (Mariana → Pipoca)
do $$
declare
  v_animal uuid;
  v_conv uuid;
begin
  select id into v_animal from public.animals where name = 'Pipoca';
  insert into public.adoption_requests (animal_id, ngo_id, adopter_id, status)
  values (v_animal, '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000000c1', 'reviewing');
  insert into public.conversations (animal_id, ngo_id, adopter_id)
  values (v_animal, '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000000c1')
  returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, body, created_at) values
    (v_conv, '00000000-0000-0000-0000-0000000000c1', 'Oi! Me apaixonei pela Pipoca. Moro em apartamento, ela se adaptaria?', now() - interval '50 minutes'),
    (v_conv, '00000000-0000-0000-0000-0000000000b1', 'Oi! Sim, ela já vive em lar temporário num apê e se dá super bem.', now() - interval '20 minutes');
end $$;

select public.recompute_ngo_rating(id) from public.ngos;
