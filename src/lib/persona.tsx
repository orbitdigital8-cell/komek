"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type PersonaRole = "client" | "specialist";

interface PersonaState {
  active: boolean;
  role: PersonaRole;
  specialistId: string;
  clientId: string;
  ready: boolean;
  setSpecialist: (id: string) => void;
  setClient: (id: string) => void;
  setRole: (r: PersonaRole) => void;
  enable: (r: PersonaRole) => void;
  disable: () => void;
}

const KEY = "komek_persona";
const Ctx = createContext<PersonaState | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [role, setRoleState] = useState<PersonaRole>("specialist");
  const [specialistId, setSpecialistId] = useState("");
  const [clientId, setClientId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setActive(!!p.active);
        setRoleState(p.role ?? "specialist");
        setSpecialistId(p.specialistId ?? "");
        setClientId(p.clientId ?? "");
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ active, role, specialistId, clientId }));
      } catch {
        /* ignore */
      }
    }
  }, [active, role, specialistId, clientId, ready]);

  const setSpecialist = useCallback((id: string) => setSpecialistId(id), []);
  const setClient = useCallback((id: string) => setClientId(id), []);
  const setRole = useCallback((r: PersonaRole) => setRoleState(r), []);
  const enable = useCallback((r: PersonaRole) => { setRoleState(r); setActive(true); }, []);
  const disable = useCallback(() => setActive(false), []);

  return (
    <Ctx.Provider value={{ active, role, specialistId, clientId, ready, setSpecialist, setClient, setRole, enable, disable }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePersona() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePersona must be used within PersonaProvider");
  return v;
}
