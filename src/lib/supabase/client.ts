"use client";

import { createBrowserClient } from "@supabase/ssr";

// Локальный Supabase живёт на том же хосте, что и открытая страница
// (desktop → localhost, телефон в той же сети → LAN-IP). Берём hostname из
// адресной строки, порт podbor — 54421. Прод-URL (https) проходит как есть.
function resolveUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (typeof window !== "undefined" && /^http:\/\/[^/]+:54421$/.test(envUrl)) {
    return `http://${window.location.hostname}:54421`;
  }
  return envUrl;
}

function make() {
  return createBrowserClient(resolveUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

// Один браузерный клиент на вкладку (иначе «Multiple GoTrueClient instances»)
let client: ReturnType<typeof make> | null = null;

export function supabaseBrowser() {
  return (client ??= make());
}
