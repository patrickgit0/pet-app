-- Fase A do plano (18/11): travas de segurança, tarefas automáticas (pg_cron) e avisos (notificações).

-- ===========================================================================
-- 1) Segurança das mensagens
-- ===========================================================================
-- Adotante envia só texto e foto; a ONG também envia proposta de visita. "system" só pelas funções internas.
-- Foto precisa estar na pasta da própria conversa. Ninguém insere mensagem já "lida" ou "confirmada".
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
    and not exists (select 1 from public.conversations c where c.id = conversation_id and c.blocked_at is not null)
    and read_at is null and visit_confirmed_at is null
    and (
      kind = 'text'
      or (kind = 'image' and attachment_path like conversation_id::text || '/%')
      or (kind = 'visit_proposal' and visit_at is not null and exists (
            select 1 from public.conversations c where c.id = conversation_id and public.is_ngo_member(c.ngo_id)))
    )
  );

-- Quem enviou não marca a própria mensagem como lida nem confirma a própria proposta de visita.
create or replace function public.guard_message_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and auth.uid() = old.sender_id then
    if new.read_at is distinct from old.read_at then raise exception 'FORBIDDEN'; end if;
    if new.visit_confirmed_at is distinct from old.visit_confirmed_at then raise exception 'FORBIDDEN'; end if;
  end if;
  if new.visit_confirmed_at is distinct from old.visit_confirmed_at and old.kind <> 'visit_proposal' then
    raise exception 'FORBIDDEN';
  end if;
  return new;
end $$;
drop trigger if exists messages_guard_update on public.messages;
create trigger messages_guard_update before update on public.messages
  for each row execute function public.guard_message_update();

-- Limites contra spam: 30 mensagens por minuto por pessoa; 5 pedidos de adoção por dia.
create or replace function public.rate_limit_messages()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.kind <> 'system' and (select count(*) from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'RATE_LIMIT';
  end if;
  return new;
end $$;
drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit before insert on public.messages
  for each row execute function public.rate_limit_messages();

create or replace function public.rate_limit_requests()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.adoption_requests
      where adopter_id = new.adopter_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'RATE_LIMIT';
  end if;
  return new;
end $$;
drop trigger if exists adoption_requests_rate_limit on public.adoption_requests;
create trigger adoption_requests_rate_limit before insert on public.adoption_requests
  for each row execute function public.rate_limit_requests();

-- ===========================================================================
-- 2) Arquivos: tamanho máximo e só imagens
-- ===========================================================================
update storage.buckets set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id in ('animal-photos', 'checkin-photos');
update storage.buckets set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  where id = 'chat-attachments';

-- ===========================================================================
-- 3) Avisos (notificações no site; e-mail quando configurado)
-- ===========================================================================
-- kind + data viram texto na interface (traduzido). link = para onde o aviso leva.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('request_new', 'request_status', 'message', 'visit', 'adoption', 'checkin')),
  data jsonb not null default '{}'::jsonb,
  link text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  emailed_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_own_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_own_update on public.notifications for update to authenticated using (user_id = auth.uid());
revoke insert, delete, update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- Cria (ou atualiza, se já existe um aviso não lido do mesmo tipo e link) — evita 20 avisos para 20 mensagens.
create or replace function public.notify(p_user uuid, p_kind text, p_data jsonb, p_link text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if p_user is null then return; end if;
  select id into v_id from public.notifications
    where user_id = p_user and kind = p_kind and link = p_link and read_at is null limit 1;
  if v_id is not null then
    update public.notifications set data = p_data, created_at = now() where id = v_id;
  else
    insert into public.notifications (user_id, kind, data, link) values (p_user, p_kind, p_data, p_link);
  end if;
end $$;
revoke execute on function public.notify from anon, authenticated, public;

-- Avisa todos os membros da ONG
create or replace function public.notify_ngo(p_ngo uuid, p_kind text, p_data jsonb, p_link text, p_except uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare m record;
begin
  for m in select user_id from public.ngo_members where ngo_id = p_ngo and user_id is distinct from p_except loop
    perform public.notify(m.user_id, p_kind, p_data, p_link);
  end loop;
end $$;
revoke execute on function public.notify_ngo from anon, authenticated, public;

-- Pedido novo → ONG; mudança de status → adotante
create or replace function public.on_request_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_animal text := (select name from public.animals where id = new.animal_id);
  v_adopter text := (select full_name from public.profiles where id = new.adopter_id);
begin
  if tg_op = 'INSERT' then
    perform public.notify_ngo(new.ngo_id, 'request_new', jsonb_build_object('adopter', v_adopter, 'animal', v_animal), '/painel/pedidos/' || new.id);
  elsif new.status is distinct from old.status and new.status in ('reviewing', 'visit_scheduled', 'approved', 'rejected') then
    perform public.notify(new.adopter_id, 'request_status', jsonb_build_object('animal', v_animal, 'status', new.status), '/meus-pedidos');
  end if;
  return new;
end $$;
drop trigger if exists adoption_requests_notify on public.adoption_requests;
create trigger adoption_requests_notify after insert or update of status on public.adoption_requests
  for each row execute function public.on_request_change();

-- Mensagem nova → a outra parte (proposta de visita tem aviso próprio)
create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  c public.conversations;
  v_animal text;
  v_from text;
  v_kind text := case when new.kind = 'visit_proposal' then 'visit' else 'message' end;
begin
  if new.kind = 'system' then return new; end if;
  select * into c from public.conversations where id = new.conversation_id;
  v_animal := (select name from public.animals where id = c.animal_id);
  if new.sender_id = c.adopter_id then
    v_from := (select full_name from public.profiles where id = new.sender_id);
    perform public.notify_ngo(c.ngo_id, v_kind, jsonb_build_object('from', v_from, 'animal', v_animal), '/mensagens/' || c.id, new.sender_id);
  else
    v_from := (select name from public.ngos where id = c.ngo_id);
    perform public.notify(c.adopter_id, v_kind, jsonb_build_object('from', v_from, 'animal', v_animal), '/mensagens/' || c.id);
  end if;
  return new;
end $$;
drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages
  for each row execute function public.on_message_insert();

-- Adoção confirmada → adotante
create or replace function public.on_adoption_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify(new.adopter_id, 'adoption', jsonb_build_object('animal', (select name from public.animals where id = new.animal_id)), '/meus-pedidos');
  return new;
end $$;
drop trigger if exists adoptions_notify on public.adoptions;
create trigger adoptions_notify after insert on public.adoptions
  for each row execute function public.on_adoption_insert();

-- Check-ins que venceram hoje → adotante (rodado pela tarefa diária)
create or replace function public.notify_due_checkins()
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select c.id, a.adopter_id, an.name as animal, c.due_day
    from public.checkins c join public.adoptions a on a.id = c.adoption_id join public.animals an on an.id = a.animal_id
    where c.status = 'pending' and c.due_at <= now() and c.due_at > now() - interval '1 day'
  loop
    perform public.notify(r.adopter_id, 'checkin', jsonb_build_object('animal', r.animal, 'days', r.due_day), '/meus-pedidos');
  end loop;
end $$;
revoke execute on function public.notify_due_checkins from anon, authenticated, public;

-- Realtime para o sininho atualizar sozinho
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- 4) Tarefas automáticas (pg_cron): todo dia às 06:00 de Brasília (09:00 UTC)
-- ===========================================================================
create extension if not exists pg_cron;
create or replace function public.run_daily_jobs()
returns void language plpgsql security definer set search_path = '' as $$
declare n record;
begin
  update public.checkins set status = 'late' where status = 'pending' and due_at < now() - interval '3 days';
  perform public.notify_due_checkins();
  for n in select id from public.ngos loop
    perform public.recompute_ngo_rating(n.id);
  end loop;
end $$;
revoke execute on function public.run_daily_jobs from anon, authenticated, public;

select cron.unschedule(jobid) from cron.job where jobname = 'adotai-daily';
select cron.schedule('adotai-daily', '0 9 * * *', 'select public.run_daily_jobs();');
