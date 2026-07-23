"use client";

import { useEffect } from "react";

const KEY = "komek_recent";

// Запоминает просмотренные анкеты для блока «Вы недавно смотрели»
export default function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    try {
      const cur: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      const next = [id, ...cur.filter((x) => x !== id)].slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [id]);
  return null;
}
