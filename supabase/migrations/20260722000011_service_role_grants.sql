-- ============================================================================
-- Гранты для service_role (админ-панель отладки читает всё в обход RLS).
-- В новых проектах Supabase таблицы public не выдаются ролям автоматически.
-- service_role обходит RLS, но всё равно требует табличных GRANT-ов.
-- ============================================================================
grant all on public.professions          to service_role;
grant all on public.profiles             to service_role;
grant all on public.specialists          to service_role;
grant all on public.specialist_contacts  to service_role;
grant all on public.specialist_socials   to service_role;
grant all on public.specialist_busy      to service_role;
grant all on public.contact_requests     to service_role;
grant all on public.reviews              to service_role;
