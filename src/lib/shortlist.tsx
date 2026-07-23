"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

const KEY = "komek_shortlist";

interface ShortlistState {
  ids: string[];
  ready: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const Ctx = createContext<ShortlistState | null>(null);

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const sb = supabaseBrowser();
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const syncedFor = useRef<string | null>(null); // для какого user_id уже слили local+БД

  // Загружаем из localStorage после монтирования (без гидрационных рассинхронов)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(ids));
      } catch {
        /* ignore */
      }
    }
  }, [ids, ready]);

  // Вход в аккаунт: сливаем локальное избранное с серверным (объединение)
  useEffect(() => {
    if (!ready || !user || syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    (async () => {
      const { data } = await sb.from("favorites").select("specialist_id").eq("user_id", user.id);
      const dbIds = ((data as { specialist_id: string }[]) ?? []).map((r) => r.specialist_id);
      const local = (() => {
        try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; }
      })();
      const merged = Array.from(new Set([...local, ...dbIds]));
      setIds(merged);
      // Локальные, которых нет в БД — дозаписываем
      const missing = merged.filter((id) => !dbIds.includes(id));
      if (missing.length) {
        await sb.from("favorites").upsert(
          missing.map((id) => ({ user_id: user.id, specialist_id: id })),
          { onConflict: "user_id,specialist_id" },
        );
      }
    })();
  }, [ready, user, sb]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((cur) => {
      const adding = !cur.includes(id);
      if (user) {
        if (adding) sb.from("favorites").upsert({ user_id: user.id, specialist_id: id }, { onConflict: "user_id,specialist_id" }).then(() => {});
        else sb.from("favorites").delete().eq("user_id", user.id).eq("specialist_id", id).then(() => {});
      }
      return adding ? [...cur, id] : cur.filter((x) => x !== id);
    });
  }, [user, sb]);

  const remove = useCallback((id: string) => {
    if (user) sb.from("favorites").delete().eq("user_id", user.id).eq("specialist_id", id).then(() => {});
    setIds((cur) => cur.filter((x) => x !== id));
  }, [user, sb]);

  const clear = useCallback(() => {
    if (user) sb.from("favorites").delete().eq("user_id", user.id).then(() => {});
    setIds([]);
  }, [user, sb]);

  return <Ctx.Provider value={{ ids, ready, has, toggle, remove, clear }}>{children}</Ctx.Provider>;
}

export function useShortlist() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShortlist must be used within ShortlistProvider");
  return v;
}
