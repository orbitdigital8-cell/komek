"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePersona } from "@/lib/persona";
import { useLang } from "@/lib/lang";
import ProfileEditor from "@/components/dashboard/ProfileEditor";
import IncomingRequests from "@/components/dashboard/IncomingRequests";
import BusyDatesManager from "@/components/dashboard/BusyDatesManager";
import DebugSpecialistCabinet from "@/components/DebugSpecialistCabinet";
import type { Profession, Social, Specialist, SpecialistContacts } from "@/lib/types";

type Tab = "profile" | "busy" | "requests";

export default function DashboardPage() {
  const sb = supabaseBrowser();
  const { user, role, loading } = useAuth();
  const persona = usePersona();
  const { t } = useLang();
  const router = useRouter();

  const debugOn = persona.ready && persona.active; // отладка включена — не требуем входа

  const [tab, setTab] = useState<Tab>("profile");
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [contacts, setContacts] = useState<SpecialistContacts | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: profs }, { data: sp }] = await Promise.all([
      sb.from("professions").select("*").order("sort_order"),
      sb.from("specialists").select("*").eq("owner_id", user.id).maybeSingle(),
    ]);
    setProfessions((profs as Profession[]) ?? []);
    const s = (sp as Specialist) ?? null;
    setSpecialist(s);
    if (s) {
      const [{ data: c }, { data: soc }, { count }] = await Promise.all([
        sb.from("specialist_contacts").select("*").eq("specialist_id", s.id).maybeSingle(),
        sb.from("specialist_socials").select("*").eq("specialist_id", s.id).order("sort_order"),
        sb.from("contact_requests").select("id", { count: "exact", head: true }).eq("specialist_id", s.id).eq("status", "pending"),
      ]);
      setContacts((c as SpecialistContacts) ?? null);
      setSocials((soc as Social[]) ?? []);
      setPendingCount(count ?? 0);
    }
    setReady(true);
  }, [sb, user]);

  useEffect(() => {
    if (debugOn) return; // режим отладки — никогда не требуем входа
    if (loading) return;
    if (!user) {
      router.push("/login?next=/dashboard");
      return;
    }
    load();
  }, [debugOn, loading, user, load, router]);

  // Отладка: смотрим кабинет выбранного специалиста
  if (debugOn) return <DebugSpecialistCabinet specialistId={persona.specialistId} />;

  if (loading || !ready) return <div className="container" style={{ padding: 48 }} />;

  if (role === "client") {
    return (
      <div className="container-narrow" style={{ padding: "48px 20px", textAlign: "center" }}>
        <div className="card card-pad">
          <div style={{ fontSize: 34 }}>⭐</div>
          <h1 className="h2" style={{ margin: "8px 0" }}>{t("Это кабинет специалиста")}</h1>
          <p className="soft">{t("Вы вошли как заказчик. Ваши запросы — в разделе «Мои запросы».")}</p>
          <Link href="/requests" className="btn btn-primary" style={{ marginTop: 12 }}>{t("Мои запросы")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h1 className="h2" style={{ marginBottom: 2 }}>{t("Кабинет специалиста")}</h1>
          <p className="soft" style={{ margin: 0 }}>
            {specialist ? t("Управляйте анкетой и заявками на связь.") : t("Заполните анкету, чтобы попасть в каталог.")}
          </p>
        </div>
        {specialist && (
          <Link href={`/s/${specialist.id}`} className="btn btn-outline btn-sm">{t("Открыть мою анкету ↗")}</Link>
        )}
      </div>

      {/* Табы */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--surface-2)", borderRadius: 999, marginBottom: 20 }}>
        <button className="btn btn-sm" onClick={() => setTab("profile")}
          style={{ background: tab === "profile" ? "var(--surface)" : "transparent", color: tab === "profile" ? "var(--brand)" : "var(--text-soft)", boxShadow: tab === "profile" ? "var(--shadow-sm)" : "none", fontWeight: 700 }}>
          {t("Анкета")}
        </button>
        <button className="btn btn-sm" onClick={() => setTab("busy")} disabled={!specialist}
          style={{ background: tab === "busy" ? "var(--surface)" : "transparent", color: tab === "busy" ? "var(--brand)" : "var(--text-soft)", boxShadow: tab === "busy" ? "var(--shadow-sm)" : "none", fontWeight: 700 }}>
          {t("Занятость")}
        </button>
        <button className="btn btn-sm" onClick={() => setTab("requests")}
          style={{ background: tab === "requests" ? "var(--surface)" : "transparent", color: tab === "requests" ? "var(--brand)" : "var(--text-soft)", boxShadow: tab === "requests" ? "var(--shadow-sm)" : "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
          {t("Заявки")} {pendingCount > 0 && <span className="pill-count">{pendingCount}</span>}
        </button>
      </div>

      {tab === "profile" ? (
        <ProfileEditor
          userId={user!.id}
          professions={professions}
          specialist={specialist}
          contacts={contacts}
          socials={socials}
          onSaved={load}
        />
      ) : tab === "busy" ? (
        specialist ? (
          <BusyDatesManager specialistId={specialist.id} />
        ) : (
          <div className="card card-pad" style={{ color: "var(--text-mute)" }}>{t("Сначала сохраните анкету.")}</div>
        )
      ) : specialist ? (
        <IncomingRequests specialistId={specialist.id} onChange={load} />
      ) : (
        <div className="card card-pad" style={{ color: "var(--text-mute)" }}>{t("Сначала сохраните анкету.")}</div>
      )}
    </div>
  );
}
