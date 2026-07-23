import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Серверный клиент Supabase (Server Components / Route Handlers)
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    // Серверные запросы идут с этого же ПК — для них можно задать отдельный
    // адрес (127.0.0.1), когда NEXT_PUBLIC_… указывает на LAN/туннель для телефона.
    process.env.SUPABASE_URL_SERVER || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // вызов из Server Component без записи cookie — ок
          }
        },
      },
    },
  );
}
