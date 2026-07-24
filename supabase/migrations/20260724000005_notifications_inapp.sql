-- ============================================================================
-- Уведомления в личном кабинете (in-app): работают всегда, без разрешений браузера.
-- Пишутся сервисной ролью при событиях; пользователь читает и помечает свои.
-- ============================================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null default '',
  url        text not null default '/',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Пользователь видит и помечает прочитанными только свои
create policy "notif read own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notif update own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- Мгновенная доставка в колокольчик
alter publication supabase_realtime add table public.notifications;
