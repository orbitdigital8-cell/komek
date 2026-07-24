# Деплой Kömek → Cloudflare Pages + облачный Supabase

Цель: платформа онлайн 24/7 на `komek.pages.dev`, видна в поисковиках.

## Что уже готово (в коде)
- ✅ Продакшн-сборка проходит (`npx next build`)
- ✅ SEO: `robots.txt`, `sitemap.xml` (650 URL), OpenGraph, metadataBase
- ✅ Бесплатный ИИ (pollinations) — работает без ключей на любом хостинге

## Шаг 1. Облачный Supabase (нужен твой аккаунт)
База сейчас локальная (на твоём ПК) — снаружи недоступна. Нужен облачный проект:
1. Зайти на https://supabase.com → **New project** (регион ближе к КЗ, напр. `Central EU`).
2. Записать: **Project URL**, **anon key**, **service_role key** (Settings → API), и **DB password**.
3. Применить наши миграции и демо-данные к облаку:
   ```bash
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push          # применит migrations/
   # затем прогнать сиды: seed.sql + seed_bulk.sql через psql к облачной БД
   ```
   (эти команды выполню я, как только будут доступы)

## Шаг 2. Репозиторий на GitHub
Cloudflare Pages деплоит из GitHub:
1. Создать пустой репозиторий на github.com (напр. `komek`).
2. `git remote add origin <url>` → `git push -u origin main` (сделаю я, дай URL).

## Шаг 3. Cloudflare Pages (нужен твой аккаунт)
1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → выбрать репозиторий `komek`.
2. Framework preset: **Next.js**. (Для Next 16 подключим адаптер `@opennextjs/cloudflare` — настрою в коде.)
3. **Environment variables** (Settings → Environment variables) — вписать:
   - `NEXT_PUBLIC_SUPABASE_URL` = облачный Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key
   - `SUPABASE_URL_SERVER` = облачный Project URL
   - `NEXT_PUBLIC_APP_URL` = `https://komek.pages.dev`
   - (опц.) `GROQ_API_KEY`, `MISTRAL_API_KEY` и т.п. — резервные ИИ
4. Deploy → получаем `https://komek.pages.dev`.

## Шаг 4. Индексация в поиске
1. https://search.google.com/search-console → добавить `komek.pages.dev`.
2. Submit sitemap: `https://komek.pages.dev/sitemap.xml`.
3. (Google обычно индексирует за несколько дней.)

## Что делаю я на каждом этапе
- Настрою адаптер Cloudflare для Next 16 в коде.
- Применю миграции/сиды к облачному Supabase (когда будут доступы).
- Запушу репозиторий (когда дашь GitHub URL).
- Проверю прод-сборку под Cloudflare.
