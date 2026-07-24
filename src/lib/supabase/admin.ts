import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "./server";

// Серверный клиент с service_role — обходит RLS для админ-панели отладки.
// НИКОГДА не импортировать в клиентские компоненты: ключ не должен попасть в браузер.
export function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL_SERVER || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Локальный debug-флаг: пускает в админку без входа (только для разработки).
// В проде НЕ ставить ADMIN_DEBUG=1 — доступ должен быть по роли admin.
export function adminEnabled() {
  return process.env.ADMIN_DEBUG === "1";
}

// Настоящая проверка доступа к админке: локальный флаг ИЛИ залогинен админ.
// Используется на странице /admin и во всех /api/admin/* — защищает публичный прод.
export async function requireAdmin(): Promise<boolean> {
  if (adminEnabled()) return true; // локальная отладка
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return false;
    const { data } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return data?.role === "admin";
  } catch {
    return false;
  }
}
