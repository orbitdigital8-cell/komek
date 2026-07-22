-- ============================================================================
-- Встроенный чат. Переписка привязана к запросу (contact_request) — это тред
-- между заказчиком и специалистом. Доступен сразу (в т.ч. до подтверждения),
-- чтобы можно было общаться до раскрытия телефона.
-- ============================================================================
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.contact_requests(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index messages_request_idx on public.messages (request_id, created_at);

alter table public.messages enable row level security;

-- Участник треда: заказчик из запроса ИЛИ владелец анкеты специалиста
create or replace function public.is_request_participant(rid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.contact_requests r
    where r.id = rid
      and (
        r.client_id = auth.uid()
        or exists (select 1 from public.specialists s where s.id = r.specialist_id and s.owner_id = auth.uid())
      )
  );
$$;
grant execute on function public.is_request_participant(uuid) to authenticated;

create policy "messages read participants" on public.messages
  for select using (public.is_request_participant(request_id));
create policy "messages insert participants" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_request_participant(request_id));

grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;

-- Realtime для мгновенной доставки
alter publication supabase_realtime add table public.messages;
