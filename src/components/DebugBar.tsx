"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePersona, type PersonaRole } from "@/lib/persona";

interface Lite { id: string; name: string }

export default function DebugBar() {
  const enabled = process.env.NEXT_PUBLIC_ADMIN_DEBUG === "1";
  const { active, role, specialistId, clientId, ready, setSpecialist, setClient, enable, disable } = usePersona();
  const router = useRouter();
  const [specialists, setSpecialists] = useState<Lite[]>([]);
  const [clients, setClients] = useState<Lite[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/data", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    const profById: Record<string, string> = {};
    for (const p of d.professions ?? []) profById[p.id] = p.label;
    setSpecialists((d.specialists ?? []).map((s: { id: string; name: string; profession: string }) => ({ id: s.id, name: `${s.name} — ${profById[s.profession] ?? s.profession}` })));
    const seen = new Map<string, string>();
    const nameById: Record<string, string> = {};
    for (const pr of d.profiles ?? []) nameById[pr.id] = pr.full_name;
    for (const req of d.requests ?? []) if (!seen.has(req.client_id)) seen.set(req.client_id, req.client_name || nameById[req.client_id] || req.client_id.slice(0, 8));
    setClients(Array.from(seen.entries()).map(([id, name]) => ({ id, name })));
  }, []);

  useEffect(() => { if (enabled) load(); }, [enabled, load]);

  // Автовыбор первой персоны, если не выбрана
  useEffect(() => {
    if (specialists.length && !specialistId) setSpecialist(specialists[0].id);
  }, [specialists, specialistId, setSpecialist]);
  useEffect(() => {
    if (clients.length && !clientId) setClient(clients[0].id);
  }, [clients, clientId, setClient]);

  const options = useMemo(() => (role === "specialist" ? specialists : clients), [role, specialists, clients]);
  const currentId = role === "specialist" ? specialistId : clientId;

  if (!enabled || !ready) return null;

  function pickRole(r: PersonaRole) {
    enable(r);
    // сразу подставляем первую персону, чтобы кабинет открылся без пустого экрана
    if (r === "specialist" && !specialistId && specialists.length) setSpecialist(specialists[0].id);
    if (r === "client" && !clientId && clients.length) setClient(clients[0].id);
    // Специалист → его кабинет; Заказчик → каталог (его домашняя страница)
    router.push(r === "specialist" ? "/dashboard" : "/");
  }
  function pickPersona(id: string) {
    if (role === "specialist") { setSpecialist(id); router.push("/dashboard"); }
    else { setClient(id); router.push("/requests"); }
  }

  const seg = (r: PersonaRole, icon: string, label: string) => (
    <button
      onClick={() => pickRole(r)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
        background: active && role === r ? "var(--surface)" : "transparent",
        color: active && role === r ? "var(--brand)" : "rgba(255,255,255,.75)",
        boxShadow: active && role === r ? "var(--shadow-sm)" : "none",
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{ position: "sticky", top: 64, zIndex: 39, background: "#2a2440", color: "#fff", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minHeight: 46, padding: "7px 22px" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: ".02em", opacity: 0.85 }}>🐞 ОТЛАДКА · смотреть как</span>

        <div style={{ display: "inline-flex", gap: 3, padding: 3, background: "rgba(255,255,255,.1)", borderRadius: 999 }}>
          {seg("client", "🔎", "Заказчик")}
          {seg("specialist", "⭐", "Специалист")}
        </div>

        {active && (
          <>
            <select
              value={currentId}
              onChange={(e) => pickPersona(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.25)", background: "#1f1a30", color: "#fff", fontSize: "0.85rem", maxWidth: 320 }}
            >
              {options.length === 0 && <option>— нет данных —</option>}
              {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <Link
              href={role === "specialist" ? "/dashboard" : "/requests"}
              style={{ padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "#fff", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              {role === "specialist" ? "Кабинет →" : "Мои запросы →"}
            </Link>
            <button onClick={disable} style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
              Выключить
            </button>
          </>
        )}
      </div>
    </div>
  );
}
