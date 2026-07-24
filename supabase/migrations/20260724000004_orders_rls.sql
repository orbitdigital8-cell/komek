-- ============================================================================
-- Ужесточаем доступ к заявкам биржи: раньше читать мог любой (using true).
-- Теперь: заказчик — свои; специалист — открытые по своей профессии; сервис — все.
-- ============================================================================
drop policy if exists "open_requests read all" on public.open_requests;

create policy "open_requests read scoped" on public.open_requests
  for select using (
    -- своя заявка
    client_id = auth.uid()
    -- открытая заявка по специальности вошедшего специалиста
    or (
      status = 'open'
      and exists (
        select 1 from public.specialists s
        where s.owner_id = auth.uid()
          and s.profession = any(open_requests.professions)
      )
    )
  );
