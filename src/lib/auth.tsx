"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

interface AuthState {
  user: User | null;
  role: Role | null;
  name: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string, role: Role) => Promise<string | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sb = supabaseBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (u: User | null) => {
      if (!u) {
        setRole(null);
        setName("");
        return;
      }
      const { data } = await sb.from("profiles").select("role, full_name").eq("id", u.id).maybeSingle();
      setRole((data?.role as Role) ?? "client");
      setName(data?.full_name ?? "");
    },
    [sb],
  );

  useEffect(() => {
    let alive = true;
    sb.auth.getUser().then(async ({ data }) => {
      if (!alive) return;
      setUser(data.user ?? null);
      await loadProfile(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange(async (_e, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [sb, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },
    [sb],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, r: Role) => {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return error.message;
      const uid = data.user?.id;
      if (uid) {
        const { error: pErr } = await sb.from("profiles").insert({ id: uid, role: r, full_name: fullName });
        if (pErr) return pErr.message;
        setRole(r);
        setName(fullName);
      }
      return null;
    },
    [sb],
  );

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
    setUser(null);
    setRole(null);
    setName("");
  }, [sb]);

  const refresh = useCallback(async () => {
    const { data } = await sb.auth.getUser();
    setUser(data.user ?? null);
    await loadProfile(data.user ?? null);
  }, [sb, loadProfile]);

  return (
    <Ctx.Provider value={{ user, role, name, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
