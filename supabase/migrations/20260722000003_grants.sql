-- ============================================================================
-- GRANT-ы. В новых проектах Supabase таблицы public не открываются ролям
-- anon/authenticated автоматически — выдаём доступ явно (RLS всё равно фильтрует).
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Каталог и профессии — читают все
grant select on public.professions to anon, authenticated;
grant select on public.specialists to anon, authenticated;

-- Действия только для вошедших пользователей
grant insert, update, delete on public.specialists to authenticated;
grant select, insert, update, delete on public.specialist_contacts to authenticated;
grant select, insert, update, delete on public.contact_requests to authenticated;
grant select, insert, update on public.profiles to authenticated;
