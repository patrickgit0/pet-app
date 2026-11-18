-- Envio dos avisos por e-mail: a cada aviso novo o banco chama POST <site>/api/notifications/email (pg_net).
-- Fica DESLIGADO até preencher as configurações (não ficam no repositório):
--   insert into private.settings values ('site_url', 'https://adotaiapp.vercel.app'), ('notify_secret', '<segredo>')
--   on conflict (key) do update set value = excluded.value;
-- e, na Vercel: NOTIFY_SECRET (o mesmo segredo), RESEND_API_KEY e EMAIL_FROM.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.settings (key text primary key, value text not null);
revoke all on private.settings from public, anon, authenticated;

create extension if not exists pg_net;

create or replace function public.email_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_url text := (select value from private.settings where key = 'site_url');
  v_secret text := (select value from private.settings where key = 'notify_secret');
  v_email text;
  v_name text;
begin
  if v_url is null or v_secret is null then return new; end if;
  select u.email, p.full_name into v_email, v_name
    from auth.users u join public.profiles p on p.id = u.id where u.id = new.user_id;
  if v_email is null or v_email like '%@adotai.invalid' or v_email like '%@adotai.dev' then return new; end if;
  perform net.http_post(
    url := v_url || '/api/notifications/email',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret),
    body := jsonb_build_object('id', new.id, 'kind', new.kind, 'data', new.data, 'link', new.link, 'email', v_email, 'name', v_name)
  );
  return new;
end $$;
revoke execute on function public.email_notification from anon, authenticated, public;

drop trigger if exists notifications_email on public.notifications;
create trigger notifications_email after insert on public.notifications
  for each row execute function public.email_notification();
