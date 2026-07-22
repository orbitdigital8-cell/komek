"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

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

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])), []);
  const remove = useCallback((id: string) => setIds((cur) => cur.filter((x) => x !== id)), []);
  const clear = useCallback(() => setIds([]), []);

  return <Ctx.Provider value={{ ids, ready, has, toggle, remove, clear }}>{children}</Ctx.Provider>;
}

export function useShortlist() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShortlist must be used within ShortlistProvider");
  return v;
}
