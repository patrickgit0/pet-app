-- CPF não pode ser trocado depois de salvo (evita uma conta "lavar" o CPF de outra pessoa).
create or replace function public.prevent_cpf_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- apagar (exclusão de conta/LGPD) é permitido; trocar por outro número, não
  if old.cpf is not null and new.cpf is not null and new.cpf <> old.cpf and not public.is_admin() then
    raise exception 'CPF_LOCKED';
  end if;
  return new;
end $$;

drop trigger if exists profile_private_cpf_locked on public.profile_private;
create trigger profile_private_cpf_locked before update of cpf on public.profile_private
  for each row execute function public.prevent_cpf_change();
