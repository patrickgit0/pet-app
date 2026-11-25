-- Vira Lar — Termo de adoção v2 e exclusão de conta mais completa (migration 15)

-- Termo padrão v2 (texto em apps/web/src/components/term-clauses.tsx). Quem já aceitou continua na versão que aceitou;
-- adoções ainda sem aceite passam para a v2.
alter table public.adoptions alter column term_version set default 'padrao-v2';
update public.adoptions set term_version = 'padrao-v2' where term_accepted_at is null and term_version = 'padrao-v1';

-- Exclusão de conta: quem já adotou é anonimizado, mas a oferta de lar temporário (com celular) também precisa sumir.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if exists (select 1 from public.adoptions where adopter_id = v_uid) then
    update public.profile_private set cpf = null, cpf_verified_at = null, phone = null, phone_verified_at = null,
      cep = null, street = null, complement = null where id = v_uid;
    update public.profiles set full_name = 'Conta excluída', avatar_url = null, neighborhood = null, location = null,
      other_pets = null, routine_notes = null where id = v_uid;
    delete from public.favorites where user_id = v_uid;
    delete from public.saved_searches where user_id = v_uid;
    delete from public.foster_offers where user_id = v_uid;
    update auth.users set email = 'excluido+' || v_uid || '@adotai.invalid', phone = null,
      encrypted_password = '', banned_until = 'infinity' where id = v_uid;
  else
    delete from auth.users where id = v_uid;
  end if;
end $$;
revoke execute on function public.delete_my_account from anon, public;
grant execute on function public.delete_my_account to authenticated;
