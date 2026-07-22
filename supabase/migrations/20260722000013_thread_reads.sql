-- ============================================================================
-- Отметки о прочтении тредов чата — для индикаторов непрочитанного.
-- last_read_at обновляется, когда пользователь открывает/смотрит чат заявки.
-- Непрочитано = сообщения этого треда позже last_read_at, отправленные не мной.
-- ============================================================================
create table public.thread_reads (
  user_id      uuid not null references auth.users(id) on delete cascade,
  request_id   uuid not null references public.contact_requests(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, request_id)
);

alter table public.thread_reads enable row level security;

create policy "thread_reads own" on public.thread_reads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.thread_reads to authenticated;
grant all on public.thread_reads to service_role;
