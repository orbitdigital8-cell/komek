"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { makeT, type Lang } from "@/lib/i18n";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: string) => string;
}

const Ctx = createContext<LangState | null>(null);

function readCookieLang(): Lang {
  if (typeof document === "undefined") return "ru";
  return /(?:^|;\s*)lang=kk(?:;|$)/.test(document.cookie) ? "kk" : "ru";
}

export function LangProvider({ children, initial }: { children: React.ReactNode; initial: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const router = useRouter();

  useEffect(() => {
    // синхронизация после гидрации (cookie мог поменяться в другой вкладке)
    const c = readCookieLang();
    if (c !== lang) setLangState(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `lang=${l}; path=/; max-age=31536000`;
    try { localStorage.setItem("komek_lang", l); } catch { /* ignore */ }
    router.refresh(); // перерендер серверных страниц с новым языком
  }, [router]);

  return <Ctx.Provider value={{ lang, setLang, t: makeT(lang) }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used within LangProvider");
  return v;
}
