-- Vira Lar — Pós-adoção completo, denúncias e bloqueio (migration 13)

-- Tipos de aviso novos: termo aceito, avaliação, denúncia (para o admin), lar temporário e feira
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in (
  'request_new', 'request_status', 'message', 'visit', 'adoption', 'checkin',
  'term_accepted', 'review', 'report', 'foster', 'event'));

-- ---------------------------------------------------------------------------
-- Bloqueio na conversa: guarda quem bloqueou; só essa pessoa (ou admin) desbloqueia
-- ---------------------------------------------------------------------------
alter table public.conversations add column if not exists blocked_by uuid references public.profiles (id) on delete set null;

create or replace function public.guard_conversation_block()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.blocked_at is not distinct from old.blocked_at then
    new.blocked_by := old.blocked_by;
    return new;
  end if;
  if new.blocked_at is not null and old.blocked_at is null then
    new.blocked_at := now();
    new.blocked_by := auth.uid();
  elsif new.blocked_at is null then
    if auth.uid() is not null and auth.uid() is distinct from old.blocked_by and not public.is_admin() then
      raise exception 'ONLY_BLOCKER_CAN_UNBLOCK';
    end if;
    new.blocked_by := null;
  else
    new.blocked_at := old.blocked_at; -- não deixa trocar a data de um bloqueio existente
    new.blocked_by := old.blocked_by;
  end if;
  return new;
end $$;

drop trigger if exists conversations_block on public.conversations;
create trigger conversations_block before update of blocked_at on public.conversations
  for each row execute function public.guard_conversation_block();

-- ---------------------------------------------------------------------------
-- Denúncias: motivo com tamanho limitado, uma denúncia aberta por alvo, aviso ao admin
-- ---------------------------------------------------------------------------
alter table public.reports drop constraint if exists reports_reason_len;
alter table public.reports add constraint reports_reason_len check (char_length(reason) between 3 and 1000);
create unique index if not exists reports_open_unique on public.reports (reporter_id, target_type, target_id) where resolved_at is null;

create or replace function public.on_report_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m record;
  v_today int;
begin
  select count(*) into v_today from public.reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day';
  if v_today >= 10 then raise exception 'RATE_LIMIT'; end if;
  for m in select id from public.profiles where role = 'admin' loop
    perform public.notify(m.id, 'report', jsonb_build_object('type', new.target_type), '/admin/denuncias');
  end loop;
  return new;
end $$;

drop trigger if exists reports_after_insert on public.reports;
create trigger reports_before_insert before insert on public.reports
  for each row execute function public.on_report_insert();

-- ---------------------------------------------------------------------------
-- Termo de adoção: aceite avisa a ONG
-- ---------------------------------------------------------------------------
create or replace function public.accept_adoption_term(p_adoption_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.adoptions;
begin
  update public.adoptions set term_accepted_at = now()
  where id = p_adoption_id and adopter_id = auth.uid() and term_accepted_at is null
  returning * into a;
  if a.id is null then return; end if;
  perform public.notify_ngo(a.ngo_id, 'term_accepted', jsonb_build_object(
    'adopter', (select full_name from public.profiles where id = a.adopter_id),
    'animal', (select name from public.animals where id = a.animal_id)), '/painel/pos-adocao');
end $$;

-- ---------------------------------------------------------------------------
-- Avaliação: 1 a 5, comentário opcional, avisa a ONG e recalcula a nota
-- ---------------------------------------------------------------------------
create or replace function public.review_ngo(p_adoption_id uuid, p_stars int, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.adoptions;
begin
  select * into a from public.adoptions where id = p_adoption_id and adopter_id = auth.uid();
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if exists (select 1 from public.reviews where adoption_id = a.id) then raise exception 'ALREADY_REVIEWED'; end if;
  insert into public.reviews (adoption_id, ngo_id, adopter_id, stars, comment)
  values (a.id, a.ngo_id, a.adopter_id, p_stars, nullif(trim(coalesce(p_comment, '')), ''));
  perform public.notify_ngo(a.ngo_id, 'review', jsonb_build_object(
    'stars', p_stars, 'animal', (select name from public.animals where id = a.animal_id)), '/painel/pos-adocao');
  perform public.recompute_ngo_rating(a.ngo_id);
end $$;

-- ---------------------------------------------------------------------------
-- Devolução: motivo obrigatório; a ONG escolhe se o animal volta direto para a vitrine
-- ---------------------------------------------------------------------------
drop function if exists public.register_return(uuid, text);
create or replace function public.register_return(p_adoption_id uuid, p_reason text, p_relist boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.adoptions;
begin
  select * into a from public.adoptions where id = p_adoption_id;
  if a.id is null or not public.is_ngo_member(a.ngo_id) then raise exception 'FORBIDDEN'; end if;
  if a.status = 'returned' then raise exception 'ALREADY_RETURNED'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'REASON_REQUIRED'; end if;
  update public.adoptions set status = 'returned', returned_at = now(), return_reason = trim(p_reason) where id = a.id;
  update public.animals set status = case when p_relist then 'available'::public.animal_status else 'draft'::public.animal_status end
    where id = a.animal_id;
  -- Check-ins futuros deixam de valer
  delete from public.checkins where adoption_id = a.id and answered_at is null;
  perform public.recompute_ngo_rating(a.ngo_id);
end $$;
revoke execute on function public.register_return(uuid, text, boolean) from anon;

-- ---------------------------------------------------------------------------
-- Check-in: foto precisa estar na pasta do próprio adotante/adoção
-- ---------------------------------------------------------------------------
create or replace function public.answer_checkin(
  p_checkin_id uuid, p_answers jsonb, p_photo_paths text[] default '{}', p_needs_help boolean default false
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_adoption uuid;
  p text;
begin
  select c.adoption_id into v_adoption from public.checkins c join public.adoptions a on a.id = c.adoption_id
    where c.id = p_checkin_id and a.adopter_id = auth.uid();
  if v_adoption is null then raise exception 'NOT_FOUND'; end if;
  foreach p in array coalesce(p_photo_paths, '{}') loop
    if p not like auth.uid()::text || '/' || v_adoption::text || '/%' then raise exception 'BAD_PHOTO_PATH'; end if;
  end loop;
  update public.checkins set
    answers = p_answers, photo_paths = coalesce(p_photo_paths, '{}'), needs_help = coalesce(p_needs_help, false),
    status = 'answered', answered_at = now()
  where id = p_checkin_id;
end $$;
