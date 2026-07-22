-- ============================================================================
-- Соцсети специалиста с гибкой видимостью (гибрид):
-- по каждой ссылке специалист сам решает — показывать всем (is_public)
-- или открывать только заказчику с подтверждённым запросом.
-- Прямые контакты (телефон/WhatsApp/Telegram) остаются в specialist_contacts.
-- ============================================================================
create table public.specialist_socials (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  type          text not null,   -- instagram | tiktok | youtube | facebook | website
  value         text not null,   -- @handle или ссылка
  is_public     boolean not null default true,
  sort_order    int not null default 0
);
create index specialist_socials_sid on public.specialist_socials (specialist_id);

alter table public.specialist_socials enable row level security;

-- Читать: публичные — все; непубличные — владелец или заказчик с accepted-запросом
create policy "socials read gated" on public.specialist_socials
  for select using (
    is_public = true
    or exists (
      select 1 from public.specialists s
      where s.id = specialist_socials.specialist_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.contact_requests r
      where r.specialist_id = specialist_socials.specialist_id
        and r.client_id = auth.uid()
        and r.status = 'accepted'
    )
  );

-- Править: только владелец анкеты
create policy "socials write own" on public.specialist_socials
  for all using (
    exists (select 1 from public.specialists s where s.id = specialist_socials.specialist_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.specialists s where s.id = specialist_socials.specialist_id and s.owner_id = auth.uid())
  );

grant select on public.specialist_socials to anon, authenticated;
grant insert, update, delete on public.specialist_socials to authenticated;
