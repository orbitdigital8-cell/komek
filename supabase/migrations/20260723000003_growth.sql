-- ============================================================================
-- Ростовые фичи: просмотры анкет, избранное в БД, жалобы, скорость ответа.
-- ============================================================================

-- ---- Просмотры анкет --------------------------------------------------------
create table public.profile_views (
  id            bigint generated always as identity primary key,
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  viewed_at     timestamptz not null default now()
);
create index profile_views_spec_idx on public.profile_views (specialist_id, viewed_at);

alter table public.profile_views enable row level security;

-- Записать просмотр может кто угодно (в т.ч. гость)
create policy "views insert all" on public.profile_views
  for insert with check (true);
-- Читать статистику может только владелец анкеты
create policy "views read owner" on public.profile_views
  for select using (
    exists (select 1 from public.specialists s where s.id = specialist_id and s.owner_id = auth.uid())
  );

grant insert on public.profile_views to anon, authenticated;
grant select on public.profile_views to authenticated;
grant all on public.profile_views to service_role;

-- ---- Избранное (синхронизация между устройствами) ---------------------------
create table public.favorites (
  user_id       uuid not null references auth.users(id) on delete cascade,
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, specialist_id)
);

alter table public.favorites enable row level security;

create policy "favorites all own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

-- ---- Жалобы -----------------------------------------------------------------
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  reporter_id   uuid references auth.users(id) on delete set null,
  reason        text not null,
  details       text not null default '',
  status        text not null default 'new' check (status in ('new', 'resolved')),
  created_at    timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;

-- Пожаловаться может кто угодно; reporter_id — либо свой uid, либо null (гость)
create policy "reports insert all" on public.reports
  for insert with check (reporter_id is null or reporter_id = auth.uid());
-- Чтение — только сервисной ролью (админка), обычным ролям select не выдаём

grant insert on public.reports to anon, authenticated;
grant all on public.reports to service_role;

-- ---- Скорость ответа --------------------------------------------------------
-- Средние минуты от создания запроса до первого сообщения специалиста.
alter table public.specialists
  add column response_minutes numeric,
  add column response_count   int not null default 0;

create or replace function public.track_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  req_created timestamptz;
  own uuid;
  delta numeric;
begin
  select r.specialist_id, r.created_at into sid, req_created
    from public.contact_requests r where r.id = new.request_id;
  if sid is null then return new; end if;
  select s.owner_id into own from public.specialists s where s.id = sid;
  -- Считаем только первое сообщение владельца анкеты в этом треде
  if own is null or new.sender_id <> own then return new; end if;
  if exists (
    select 1 from public.messages m
    where m.request_id = new.request_id and m.sender_id = new.sender_id and m.id <> new.id
  ) then return new; end if;
  delta := greatest(0, extract(epoch from (new.created_at - req_created)) / 60);
  update public.specialists s set
    response_minutes = (coalesce(s.response_minutes, 0) * s.response_count + delta) / (s.response_count + 1),
    response_count   = s.response_count + 1
  where s.id = sid;
  return new;
end;
$$;

create trigger messages_track_response
  after insert on public.messages
  for each row execute function public.track_response();
