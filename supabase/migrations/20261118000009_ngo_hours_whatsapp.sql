-- ONG: WhatsApp (link wa.me para o adotante) e horário de funcionamento.
-- opening_hours: {"mon":{"open":"09:00","close":"17:00"},"tue":null,...}  (null/ausente = fechado)

alter table public.ngos add column if not exists whatsapp text
  check (whatsapp is null or whatsapp ~ '^55[1-9][0-9][0-9]{8,9}$');
alter table public.ngos add column if not exists opening_hours jsonb;
grant update (whatsapp, opening_hours) on public.ngos to authenticated;

-- Admin também lê anexos do chat (moderação, conversa em modo leitura)
drop policy if exists "chat attachments participant read" on storage.objects;
create policy "chat attachments participant read" on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments'
    and (public.is_conversation_participant(((storage.foldername(name))[1])::uuid) or public.is_admin()));

-- Dados fictícios: horário e WhatsApp da ONG de demonstração (se existir)
update public.ngos set
  opening_hours = '{"mon":{"open":"09:00","close":"17:00"},"tue":{"open":"09:00","close":"17:00"},"wed":{"open":"09:00","close":"17:00"},"thu":{"open":"09:00","close":"17:00"},"fri":{"open":"09:00","close":"17:00"},"sat":{"open":"09:00","close":"13:00"},"sun":null}'::jsonb
where opening_hours is null and slug in ('amigos-de-quatro-patas', 'ong-exemplo', 'patas-unidas', 'lar-do-focinho', 'abrigo-esperanca');
