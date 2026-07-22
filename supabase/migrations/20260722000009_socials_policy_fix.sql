-- ============================================================================
-- Фикс политики чтения соцсетей.
-- Прошлая версия ссылалась на contact_requests прямым подзапросом. Т.к. таблица
-- specialist_socials доступна anon, а на contact_requests у anon нет прав,
-- любой анонимный запрос падал с permission denied. Выносим проверку
-- «есть подтверждённый запрос» в SECURITY DEFINER функцию — она читает
-- contact_requests от имени владельца, не требуя грантов у вызывающей роли.
-- ============================================================================
create or replace function public.has_accepted_request(sid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.contact_requests r
    where r.specialist_id = sid
      and r.client_id = auth.uid()
      and r.status = 'accepted'
  );
$$;

grant execute on function public.has_accepted_request(uuid) to anon, authenticated;

drop policy "socials read gated" on public.specialist_socials;
create policy "socials read gated" on public.specialist_socials
  for select using (
    is_public = true
    or exists (
      select 1 from public.specialists s
      where s.id = specialist_socials.specialist_id and s.owner_id = auth.uid()
    )
    or public.has_accepted_request(specialist_socials.specialist_id)
  );
