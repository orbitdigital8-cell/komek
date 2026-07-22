-- ============================================================================
-- Демо-анкеты (owner_id = null) некому подтверждать запросы вручную.
-- Чтобы механику «контакт после подтверждения» можно было увидеть на демо,
-- запрос к демо-специалисту подтверждается автоматически. У реальных анкет
-- (с владельцем) подтверждение остаётся ручным — через кабинет специалиста.
-- ============================================================================
create or replace function public.auto_accept_demo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.specialists s where s.id = new.specialist_id and s.is_demo) then
    new.status := 'accepted';
  end if;
  return new;
end;
$$;

create trigger contact_requests_auto_accept
  before insert on public.contact_requests
  for each row execute function public.auto_accept_demo();
