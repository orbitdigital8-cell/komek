-- ============================================================================
-- Отзывы + честный рейтинг + теги.
--   • Отзыв может оставить ТОЛЬКО заказчик с подтверждённым запросом (accepted).
--   • rating специалиста пересчитывается как среднее по отзывам (пока отзывов
--     нет — остаётся базовое сид-значение).
--   • tags — метки для уточняющего фильтра каталога.
-- ============================================================================

alter table public.specialists add column review_count int not null default 0;
alter table public.specialists add column tags text[] not null default '{}';

create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  client_id     uuid not null references auth.users(id) on delete cascade,
  author_name   text not null default '',
  rating        int  not null check (rating between 1 and 5),
  text          text not null default '',
  created_at    timestamptz not null default now(),
  unique (specialist_id, client_id)   -- один отзыв на связку заказчик↔специалист
);
create index reviews_specialist_idx on public.reviews (specialist_id);

alter table public.reviews enable row level security;

-- Отзывы читают все
create policy "reviews read" on public.reviews
  for select using (true);
-- Оставить отзыв — только заказчик с подтверждённым запросом к этому специалисту
create policy "reviews insert confirmed" on public.reviews
  for insert with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.contact_requests r
      where r.specialist_id = reviews.specialist_id
        and r.client_id = auth.uid()
        and r.status = 'accepted'
    )
  );
-- Автор правит и удаляет свой отзыв
create policy "reviews update own" on public.reviews
  for update using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy "reviews delete own" on public.reviews
  for delete using (client_id = auth.uid());

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

-- Пересчёт рейтинга и количества отзывов после любого изменения отзывов
create or replace function public.recalc_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  n   int;
  a   numeric;
begin
  sid := coalesce(new.specialist_id, old.specialist_id);
  select count(*), avg(rating) into n, a from public.reviews where specialist_id = sid;
  if n > 0 then
    update public.specialists set rating = round(a, 1), review_count = n where id = sid;
  else
    update public.specialists set review_count = 0 where id = sid;
  end if;
  return null;
end;
$$;

create trigger reviews_recalc
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_rating();
