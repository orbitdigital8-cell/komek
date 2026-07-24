-- ============================================================================
-- Настройки уведомлений специалиста: Web Push (браузер) и Telegram.
-- ============================================================================
create table public.notification_prefs (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  web_push         jsonb,                       -- PushSubscription (endpoint + keys)
  web_enabled      boolean not null default false,
  telegram_chat_id text,
  tg_enabled       boolean not null default false,
  updated_at       timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

-- Владелец управляет своими настройками; отправка идёт сервисной ролью (обход RLS)
create policy "notif own" on public.notification_prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.notification_prefs to authenticated;
grant all on public.notification_prefs to service_role;

-- Код привязки Telegram (короткоживущий): специалист шлёт /start <code> боту
create table public.telegram_links (
  code       text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.telegram_links enable row level security;
create policy "tglink own" on public.telegram_links
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on public.telegram_links to authenticated;
grant all on public.telegram_links to service_role;
