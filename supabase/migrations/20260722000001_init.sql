-- ============================================================================
-- Подбор — маркетплейс специалистов для мероприятий
-- Базовая схема: справочник профессий, профили, анкеты специалистов,
-- скрытые контакты, запросы на связь.
-- ============================================================================

-- Справочник профессий (data-driven фильтр каталога)
create table public.professions (
  id         text primary key,          -- slug: tamada, dj, nanny...
  label      text not null,             -- «Тамада», «Диджей»
  emoji      text not null default '🎯',
  category   text not null default 'Услуги',
  sort_order int  not null default 100
);

-- Профиль пользователя (роль в системе). id совпадает с auth.users.id
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'client' check (role in ('client', 'specialist', 'admin')),
  full_name  text not null default '',
  created_at timestamptz not null default now()
);

-- Анкета специалиста. Публично видна всё, КРОМЕ контактов (они в отдельной таблице).
create table public.specialists (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade,  -- null = демо-анкета
  profession   text not null references public.professions(id),
  name         text not null,
  city         text not null default 'Алматы',
  tagline      text not null default '',        -- короткая подпись под именем
  about        text not null default '',        -- подробное описание
  price_from   int,                             -- «от N ₸» (null — договорная)
  experience_years int not null default 0,
  avatar_url   text not null default '',
  video_url    text not null default '',        -- видео-визитка (ссылка/файл)
  work_link    text not null default '',        -- ссылка на работы/соцсети (тамада, аниматоры)
  gallery      text[] not null default '{}',    -- галерея фото
  rating       numeric(2,1) not null default 0, -- 0.0..5.0
  published    boolean not null default true,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Контакты специалиста — ОТДЕЛЬНО, чтобы RLS открывала их только после подтверждения.
create table public.specialist_contacts (
  specialist_id uuid primary key references public.specialists(id) on delete cascade,
  phone      text not null default '',
  whatsapp   text not null default '',
  instagram  text not null default '',
  telegram   text not null default ''
);

-- Запрос заказчика на связь со специалистом.
-- Контакты открываются заказчику только когда status = 'accepted'.
create table public.contact_requests (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  client_id     uuid not null references auth.users(id) on delete cascade,
  client_name   text not null default '',
  client_phone  text not null default '',
  event_date    date,
  message       text not null default '',
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  unique (specialist_id, client_id)   -- один активный запрос на связку заказчик↔специалист
);

create index specialists_profession_idx on public.specialists (profession);
create index specialists_city_idx       on public.specialists (city);
create index specialists_owner_idx      on public.specialists (owner_id);
create index requests_specialist_idx    on public.contact_requests (specialist_id);
create index requests_client_idx        on public.contact_requests (client_id);
