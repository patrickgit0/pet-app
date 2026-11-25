-- Vira Lar — Storage e Realtime

-- Buckets: fotos de animais são públicas; fotos de check-in e anexos do chat são privados.
insert into storage.buckets (id, name, public) values
  ('animal-photos', 'animal-photos', true),
  ('checkin-photos', 'checkin-photos', false),
  ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

-- animal-photos: caminho = <ngo_id>/<animal_id>/<arquivo>
create policy "animal photos public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'animal-photos');
create policy "animal photos ngo write" on storage.objects for insert to authenticated
  with check (bucket_id = 'animal-photos' and public.is_ngo_member(((storage.foldername(name))[1])::uuid));
create policy "animal photos ngo delete" on storage.objects for delete to authenticated
  using (bucket_id = 'animal-photos' and public.is_ngo_member(((storage.foldername(name))[1])::uuid));

-- checkin-photos: caminho = <adopter_id>/<adoption_id>/<arquivo>
create policy "checkin photos adopter write" on storage.objects for insert to authenticated
  with check (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "checkin photos read" on storage.objects for select to authenticated
  using (
    bucket_id = 'checkin-photos' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.adoptions a
        where a.id::text = (storage.foldername(name))[2] and public.is_ngo_member(a.ngo_id)
      )
    )
  );

-- chat-attachments: caminho = <conversation_id>/<arquivo>
create policy "chat attachments participant write" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-attachments'
    and public.is_conversation_participant(((storage.foldername(name))[1])::uuid));
create policy "chat attachments participant read" on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments'
    and public.is_conversation_participant(((storage.foldername(name))[1])::uuid));

-- Realtime para o chat
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
