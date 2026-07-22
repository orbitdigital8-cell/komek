-- ============================================================================
-- Row Level Security. Ключевая логика: контакты видны только владельцу анкеты
-- и заказчику с ПОДТВЕРЖДЁННЫМ запросом на связь.
-- ============================================================================

alter table public.professions          enable row level security;
alter table public.profiles             enable row level security;
alter table public.specialists          enable row level security;
alter table public.specialist_contacts  enable row level security;
alter table public.contact_requests     enable row level security;

-- Справочник профессий — читают все (в т.ч. анонимные)
create policy "professions read" on public.professions
  for select using (true);

-- Профили: пользователь видит и правит только свой
create policy "profile read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profile insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profile update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Анкеты специалистов: опубликованные видны всем; владелец видит и свои черновики
create policy "specialist read published" on public.specialists
  for select using (published = true or owner_id = auth.uid());
create policy "specialist insert own" on public.specialists
  for insert with check (owner_id = auth.uid());
create policy "specialist update own" on public.specialists
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "specialist delete own" on public.specialists
  for delete using (owner_id = auth.uid());

-- КОНТАКТЫ: только владелец анкеты ИЛИ заказчик с подтверждённым запросом
create policy "contacts read gated" on public.specialist_contacts
  for select using (
    exists (
      select 1 from public.specialists s
      where s.id = specialist_contacts.specialist_id
        and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.contact_requests r
      where r.specialist_id = specialist_contacts.specialist_id
        and r.client_id = auth.uid()
        and r.status = 'accepted'
    )
  );
-- Владелец анкеты правит свои контакты
create policy "contacts write own" on public.specialist_contacts
  for all using (
    exists (
      select 1 from public.specialists s
      where s.id = specialist_contacts.specialist_id
        and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.specialists s
      where s.id = specialist_contacts.specialist_id
        and s.owner_id = auth.uid()
    )
  );

-- Запросы на связь:
--  • заказчик создаёт запрос от своего имени;
--  • заказчик видит свои запросы;
--  • владелец анкеты видит запросы к своей анкете и меняет их статус.
create policy "request insert client" on public.contact_requests
  for insert with check (client_id = auth.uid());
create policy "request read own" on public.contact_requests
  for select using (
    client_id = auth.uid()
    or exists (
      select 1 from public.specialists s
      where s.id = contact_requests.specialist_id
        and s.owner_id = auth.uid()
    )
  );
create policy "request update specialist" on public.contact_requests
  for update using (
    exists (
      select 1 from public.specialists s
      where s.id = contact_requests.specialist_id
        and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.specialists s
      where s.id = contact_requests.specialist_id
        and s.owner_id = auth.uid()
    )
  );
-- заказчик может отозвать (удалить) свой запрос
create policy "request delete client" on public.contact_requests
  for delete using (client_id = auth.uid());
