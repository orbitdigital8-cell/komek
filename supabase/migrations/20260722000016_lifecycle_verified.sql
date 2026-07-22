-- ============================================================================
-- Жизненный цикл заказа: Принят → Забронирован → Завершён (или Отменён).
-- Бронь авто-блокирует дату в занятости. + знак «Проверен» у специалиста.
-- ============================================================================

-- Расширяем статусы заявки
alter table public.contact_requests drop constraint if exists contact_requests_status_check;
alter table public.contact_requests
  add constraint contact_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'booked', 'completed', 'cancelled'));

-- Бронь синхронит занятость специалиста
create or replace function public.sync_booking_busy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'booked' and new.event_date is not null then
    insert into public.specialist_busy (specialist_id, busy_date, note)
    values (new.specialist_id, new.event_date, 'бронь через Kömek')
    on conflict do nothing;
  elsif old.status = 'booked' and new.status not in ('booked', 'completed') and old.event_date is not null then
    delete from public.specialist_busy
    where specialist_id = old.specialist_id and busy_date = old.event_date and note = 'бронь через Kömek';
  end if;
  return new;
end;
$$;

create trigger contact_requests_booking
  after update of status on public.contact_requests
  for each row execute function public.sync_booking_busy();

-- Отзыв можно оставить на любом «открытом» статусе (не только accepted)
drop policy if exists "reviews insert confirmed" on public.reviews;
create policy "reviews insert confirmed" on public.reviews
  for insert with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.contact_requests r
      where r.specialist_id = reviews.specialist_id
        and r.client_id = auth.uid()
        and r.status in ('accepted', 'booked', 'completed')
    )
  );

-- Знак «Проверен»
alter table public.specialists add column verified boolean not null default false;
