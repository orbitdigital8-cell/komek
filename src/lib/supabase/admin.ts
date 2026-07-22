import "server-only";
import { createClient } from "@supabase/supabase-js";

// Серверный клиент с service_role — обходит RLS для админ-панели отладки.
// НИКОГДА не импортировать в клиентские компоненты: ключ не должен попасть в браузер.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Панель доступна только когда включён флаг ADMIN_DEBUG (в проде — выключить).
export function adminEnabled() {
  return process.env.ADMIN_DEBUG === "1";
}
