-- ============================================================================
-- Маркетплейс-механики: биржа открытых заявок (в т.ч. «собрать той целиком»),
-- пакеты услуг, портфолио-кейсы, фото в отзывах, ИИ-перевод анкет (ru→kk).
-- ============================================================================

-- ---- Открытые заявки (тендер + конструктор тоя) -----------------------------
create table public.open_requests (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references auth.users(id) on delete cascade,
  client_name text not null default '',
  professions text[] not null,             -- несколько категорий = «собрать той»
  city        text not null,
  event_date  date,
  budget      int,                          -- общий бюджет, ₸
  details     text not null default '',
  status      text not null default 'open' check (status in ('open', 'closed')),
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index open_requests_status_idx on public.open_requests (status, created_at desc);

alter table public.open_requests enable row level security;

-- Доску заявок видят все (специалисты выбирают, на что откликнуться)
create policy "open_requests read all" on public.open_requests
  for select using (true);
create policy "open_requests insert own" on public.open_requests
  for insert with check (client_id = auth.uid());
create policy "open_requests update own" on public.open_requests
  for update using (client_id = auth.uid());

grant select on public.open_requests to anon, authenticated;
grant insert, update on public.open_requests to authenticated;
grant all on public.open_requests to service_role;

-- ---- Отклики специалистов ---------------------------------------------------
create table public.open_request_bids (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.open_requests(id) on delete cascade,
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  price         int,
  message       text not null default '',
  created_at    timestamptz not null default now(),
  unique (request_id, specialist_id)
);

alter table public.open_request_bids enable row level security;

-- Отклики видят: автор заявки и владелец анкеты-отклика.
-- Демо-отклики (анкета без владельца) видны всем — это витрина.
create policy "bids read participants" on public.open_request_bids
  for select using (
    exists (select 1 from public.open_requests r where r.id = request_id and (r.client_id = auth.uid() or r.is_demo))
    or exists (select 1 from public.specialists s where s.id = specialist_id and (s.owner_id = auth.uid() or s.owner_id is null))
  );
create policy "bids insert own specialist" on public.open_request_bids
  for insert with check (
    exists (select 1 from public.specialists s where s.id = specialist_id and s.owner_id = auth.uid())
  );
create policy "bids delete own" on public.open_request_bids
  for delete using (
    exists (select 1 from public.specialists s where s.id = specialist_id and s.owner_id = auth.uid())
  );

grant select on public.open_request_bids to anon, authenticated;
grant insert, delete on public.open_request_bids to authenticated;
grant all on public.open_request_bids to service_role;

-- ---- Пакеты услуг -----------------------------------------------------------
create table public.specialist_packages (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  name          text not null,
  price         int not null,
  description   text not null default '',
  sort_order    int not null default 0
);
create index packages_spec_idx on public.specialist_packages (specialist_id, sort_order);

alter table public.specialist_packages enable row level security;

create policy "packages read all" on public.specialist_packages
  for select using (true);
create policy "packages cud own" on public.specialist_packages
  for all using (
    exists (select 1 from public.specialists s where s.id = specialist_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.specialists s where s.id = specialist_id and s.owner_id = auth.uid())
  );

grant select on public.specialist_packages to anon, authenticated;
grant insert, update, delete on public.specialist_packages to authenticated;
grant all on public.specialist_packages to service_role;

-- ---- Портфолио-кейсы --------------------------------------------------------
create table public.portfolio_cases (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  photos        text[] not null default '{}',
  event_date    date,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index cases_spec_idx on public.portfolio_cases (specialist_id, sort_order);

alter table public.portfolio_cases enable row level security;

create policy "cases read all" on public.portfolio_cases
  for select using (true);
create policy "cases cud own" on public.portfolio_cases
  for all using (
    exists (select 1 from public.specialists s where s.id = specialist_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.specialists s where s.id = specialist_id and s.owner_id = auth.uid())
  );

grant select on public.portfolio_cases to anon, authenticated;
grant insert, update, delete on public.portfolio_cases to authenticated;
grant all on public.portfolio_cases to service_role;

-- ---- Фото в отзывах ---------------------------------------------------------
alter table public.reviews add column photos text[] not null default '{}';

-- ---- ИИ-перевод анкеты на казахский (заполняется по кнопке в редакторе) -----
alter table public.specialists
  add column tagline_kk text not null default '',
  add column about_kk   text not null default '';
