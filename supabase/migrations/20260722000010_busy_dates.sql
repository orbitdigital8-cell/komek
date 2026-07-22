-- ============================================================================
-- Занятость специалиста по датам.
-- Специалист отмечает дни, когда он занят; заказчик указывает нужную дату
-- в запросе и сразу видит, свободен ли специалист.
-- Даты видны всем (чтобы заказчик понимал занятость до отправки запроса).
-- ============================================================================
create table public.specialist_busy (
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  busy_date     date not null,
  note          text not null default '',
  primary key (specialist_id, busy_date)
);
create index specialist_busy_date_idx on public.specialist_busy (busy_date);

alter table public.specialist_busy enable row level security;

create policy "busy read" on public.specialist_busy
  for select using (true);
create policy "busy write own" on public.specialist_busy
  for all using (
    exists (select 1 from public.specialists s where s.id = specialist_busy.specialist_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.specialists s where s.id = specialist_busy.specialist_id and s.owner_id = auth.uid())
  );

grant select on public.specialist_busy to anon, authenticated;
grant insert, update, delete on public.specialist_busy to authenticated;
