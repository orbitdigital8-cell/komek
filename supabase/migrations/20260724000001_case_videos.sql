-- Видео в примерах работ (кроме фото)
alter table public.portfolio_cases add column videos text[] not null default '{}';
