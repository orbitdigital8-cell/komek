-- ============================================================================
-- Онлайн-статус, выполненные заказы (уровни лояльности), видео-отзывы.
-- ============================================================================

-- Последняя активность специалиста (для «● онлайн / был N назад»)
alter table public.specialists add column last_seen timestamptz;

-- Счётчик выполненных заказов — для бейджей-уровней (10/50/100)
alter table public.specialists add column orders_count int not null default 0;

-- Видео-отзыв (короткий кружок от заказчика)
alter table public.reviews add column video text not null default '';

-- Специалист «трогает» свою активность (вызывается из кабинета).
create or replace function public.touch_last_seen(sid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.specialists set last_seen = now()
  where id = sid and owner_id = auth.uid();
$$;
grant execute on public.touch_last_seen(uuid) to authenticated;

-- При завершении заказа увеличиваем счётчик выполненных
create or replace function public.bump_orders_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.specialists set orders_count = orders_count + 1 where id = new.specialist_id;
  end if;
  return new;
end;
$$;

create trigger contact_requests_bump_orders
  after update on public.contact_requests
  for each row execute function public.bump_orders_count();
