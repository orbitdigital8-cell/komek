-- ============================================================================
-- Storage: публичный бакет media для аватаров, галереи и видео-визиток.
-- Читают все, загружают/удаляют — вошедшие пользователи в своей папке /{uid}/…
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media user upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media user update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media user delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
