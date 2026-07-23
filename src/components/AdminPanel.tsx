"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDate, priceLabel, STATUS_BADGE, STATUS_LABEL, type BusyDate, type ContactRequest, type Profession, type RequestStatus, type Review, type Social, type Specialist, type SpecialistContacts } from "@/lib/types";

interface Report {
  id: string;
  specialist_id: string;
  reporter_id: string | null;
  reason: string;
  details: string;
  status: "new" | "resolved";
  created_at: string;
}

interface AdminData {
  professions: Profession[];
  specialists: Specialist[];
  requests: ContactRequest[];
  reviews: Review[];
  profiles: { id: string; role: string; full_name: string }[];
  busy: BusyDate[];
  contacts: SpecialistContacts[];
  socials: Social[];
  reports: Report[];
}

type Tab = "overview" | "requests" | "specialists" | "reports" | "persona";

type Maps = {
  spById: Record<string, Specialist>;
  profById: Record<string, Profession>;
  profileById: Record<string, { id: string; role: string; full_name: string }>;
  contactsBySp: Record<string, SpecialistContacts>;
};

export default function AdminPanel() {
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/data", { cache: "no-store" });
    if (!r.ok) { setErr("Нет доступа (ADMIN_DEBUG выключен?)"); return; }
    setData(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: RequestStatus) {
    await fetch("/api/admin/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  }

  const maps = useMemo(() => {
    const spById: Record<string, Specialist> = {};
    const profById: Record<string, Profession> = {};
    const profileById: Record<string, { id: string; role: string; full_name: string }> = {};
    const contactsBySp: Record<string, SpecialistContacts> = {};
    if (data) {
      for (const s of data.specialists) spById[s.id] = s;
      for (const p of data.professions) profById[p.id] = p;
      for (const p of data.profiles) profileById[p.id] = p;
      for (const c of data.contacts) contactsBySp[c.specialist_id] = c;
    }
    return { spById, profById, profileById, contactsBySp };
  }, [data]);

  if (err) return <div className="container" style={{ padding: 48 }}><div className="card card-pad">{err}</div></div>;
  if (!data) return <div className="container" style={{ padding: 48 }}>Загрузка…</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Обзор" },
    { key: "requests", label: `Заявки (${data.requests.length})` },
    { key: "specialists", label: `Специалисты (${data.specialists.length})` },
    { key: "reports", label: `Жалобы (${(data.reports ?? []).filter((r) => r.status === "new").length})` },
    { key: "persona", label: "Персоны — обе панели" },
  ];

  return (
    <div className="container" style={{ padding: "28px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <h1 className="h2" style={{ margin: 0 }}>⚙ Админ-панель <span className="badge badge-mute">отладка</span></h1>
        <button onClick={load} className="btn btn-outline btn-sm">↻ Обновить</button>
      </div>
      <p className="soft" style={{ marginBottom: 18 }}>Полный доступ ко всем данным в обход RLS. Только для локальной отладки.</p>

      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--surface-2)", borderRadius: 999, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="btn btn-sm"
            style={{ background: tab === t.key ? "var(--surface)" : "transparent", color: tab === t.key ? "var(--brand)" : "var(--text-soft)", boxShadow: tab === t.key ? "var(--shadow-sm)" : "none", fontWeight: 700 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview data={data} />}
      {tab === "requests" && <RequestsTable data={data} maps={maps} onStatus={setStatus} />}
      {tab === "specialists" && <SpecialistsTable data={data} maps={maps} />}
      {tab === "reports" && <ReportsTable data={data} maps={maps} onDone={load} />}
      {tab === "persona" && <Persona data={data} maps={maps} onStatus={setStatus} />}
    </div>
  );
}

/* ---------- Обзор ---------- */
function Overview({ data }: { data: AdminData }) {
  const byStatus = (s: RequestStatus) => data.requests.filter((r) => r.status === s).length;
  const cards = [
    { label: "Специалисты", value: data.specialists.length, sub: `${data.specialists.filter((s) => s.is_demo).length} демо` },
    { label: "Заявки", value: data.requests.length, sub: `${byStatus("pending")} ждут · ${byStatus("accepted")} принято · ${byStatus("declined")} отклонено` },
    { label: "Отзывы", value: data.reviews.length, sub: "" },
    { label: "Пользователи", value: data.profiles.length, sub: `${data.profiles.filter((p) => p.role === "specialist").length} спец · ${data.profiles.filter((p) => p.role === "client").length} заказчиков` },
    { label: "Занятые даты", value: data.busy.length, sub: "" },
    { label: "Соцсети", value: data.socials.length, sub: `${data.socials.filter((s) => !s.is_public).length} скрытых` },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
      {cards.map((c) => (
        <div key={c.label} className="card card-pad">
          <div className="muted" style={{ fontSize: "0.85rem" }}>{c.label}</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand)" }}>{c.value}</div>
          {c.sub && <div className="soft" style={{ fontSize: "0.8rem" }}>{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Жалобы ---------- */
function ReportsTable({ data, maps, onDone }: { data: AdminData; maps: Maps; onDone: () => void }) {
  const reports = data.reports ?? [];
  async function setReportStatus(id: string, status: "new" | "resolved") {
    await fetch("/api/admin/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    onDone();
  }
  if (reports.length === 0) return <div className="card card-pad muted">Жалоб нет.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {reports.map((r) => {
        const sp = maps.spById[r.specialist_id];
        return (
          <div key={r.id} className="card card-pad" style={{ opacity: r.status === "resolved" ? 0.55 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <strong>{r.reason}</strong>
                <span className="muted" style={{ marginLeft: 10, fontSize: "0.82rem" }}>{formatDate(r.created_at)}</span>
                <div style={{ marginTop: 4 }}>
                  {sp ? (
                    <Link href={`/s/${sp.id}`} className="link">{sp.name}</Link>
                  ) : (
                    <span className="muted">анкета удалена</span>
                  )}
                  <span className="muted" style={{ marginLeft: 8, fontSize: "0.82rem" }}>
                    {r.reporter_id ? `от ${maps.profileById[r.reporter_id]?.full_name || "пользователя"}` : "от гостя"}
                  </span>
                </div>
                {r.details && <p className="soft" style={{ fontSize: "0.9rem", margin: "6px 0 0" }}>{r.details}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                {r.status === "new" ? (
                  <button className="btn btn-primary btn-sm" onClick={() => setReportStatus(r.id, "resolved")}>✓ Решено</button>
                ) : (
                  <>
                    <span className="badge badge-completed">решено</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setReportStatus(r.id, "new")}>↺ Вернуть</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Заявки ---------- */
function RequestsTable({ data, maps, onStatus }: { data: AdminData; maps: Maps; onStatus: (id: string, s: RequestStatus) => void }) {
  if (data.requests.length === 0) return <div className="card card-pad muted">Заявок пока нет.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.requests.map((r) => {
        const sp = maps.spById[r.specialist_id];
        return (
          <div key={r.id} className="card card-pad" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div><strong>{r.client_name || "Заказчик"}</strong> {r.client_phone && <span className="muted">· {r.client_phone}</span>}</div>
              <div className="soft" style={{ fontSize: "0.86rem" }}>
                → {sp ? <Link href={`/s/${sp.id}`} className="link">{sp.name}</Link> : r.specialist_id}
                {r.event_date ? ` · 📅 ${r.event_date}` : ""}
              </div>
              {r.message && <div className="muted" style={{ fontSize: "0.82rem", marginTop: 4 }}>{r.message}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-primary btn-sm" onClick={() => onStatus(r.id, "accepted")}>✓</button>
              <button className="btn btn-outline btn-sm" onClick={() => onStatus(r.id, "declined")}>✕</button>
              <button className="btn btn-ghost btn-sm" onClick={() => onStatus(r.id, "pending")}>↺</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Специалисты ---------- */
function SpecialistsTable({ data, maps }: { data: AdminData; maps: Maps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.specialists.map((s) => (
        <div key={s.id} className="card card-pad" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.avatar_url} alt="" className="avatar" style={{ width: 40, height: 40 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/s/${s.id}`} className="link">{s.name}</Link>
            <div className="soft" style={{ fontSize: "0.84rem" }}>
              {maps.profById[s.profession]?.label ?? s.profession} · 📍 {s.city} · {priceLabel(s.price_from)}
            </div>
          </div>
          {s.is_demo && <span className="badge badge-mute">демо</span>}
          {!s.published && <span className="badge badge-declined">скрыт</span>}
          <span className="badge badge-soft">★ {s.rating} · {s.review_count}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Персоны: обе панели ---------- */
function Persona({ data, maps, onStatus }: { data: AdminData; maps: Maps; onStatus: (id: string, s: RequestStatus) => void }) {
  const [spId, setSpId] = useState(data.specialists[0]?.id ?? "");
  // список заказчиков — уникальные client_id из заявок
  const clients = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of data.requests) if (!seen.has(r.client_id)) seen.set(r.client_id, r.client_name || maps.profileById[r.client_id]?.full_name || r.client_id.slice(0, 8));
    return Array.from(seen.entries());
  }, [data.requests, maps.profileById]);
  const [clientId, setClientId] = useState(clients[0]?.[0] ?? "");

  const sp = maps.spById[spId];
  const spRequests = data.requests.filter((r) => r.specialist_id === spId);
  const spBusy = data.busy.filter((b) => b.specialist_id === spId).sort((a, b) => a.busy_date.localeCompare(b.busy_date));
  const spContacts = maps.contactsBySp[spId];

  const clientRequests = data.requests.filter((r) => r.client_id === clientId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }} className="editor-grid">
      {/* Панель специалиста */}
      <div className="card card-pad">
        <h3 className="h2" style={{ fontSize: "1.05rem", marginTop: 0 }}>⭐ Панель специалиста</h3>
        <select className="select" value={spId} onChange={(e) => setSpId(e.target.value)} style={{ marginBottom: 12 }}>
          {data.specialists.map((s) => <option key={s.id} value={s.id}>{s.name} — {maps.profById[s.profession]?.label}</option>)}
        </select>
        {sp && (
          <>
            <div className="soft" style={{ fontSize: "0.86rem", marginBottom: 10 }}>
              📍 {sp.city} · {priceLabel(sp.price_from)} · ★ {sp.rating} ({sp.review_count})
              {spContacts && <div className="muted" style={{ marginTop: 2 }}>☎ {spContacts.phone} {spContacts.instagram}</div>}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: "0.9rem" }}>Занятые даты:</strong>{" "}
              {spBusy.length === 0 ? <span className="muted">нет</span> : spBusy.map((b) => <span key={b.busy_date} className="badge badge-declined" style={{ marginRight: 4 }}>{formatDate(b.busy_date)}</span>)}
            </div>
            <strong style={{ fontSize: "0.9rem" }}>Входящие заявки ({spRequests.length}):</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {spRequests.length === 0 ? <span className="muted">Нет заявок.</span> : spRequests.map((r) => (
                <div key={r.id} style={{ padding: "8px 10px", borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{r.client_name || "Заказчик"} {r.event_date && <span className="muted">· {r.event_date}</span>}</span>
                    <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  {r.status === "pending" && (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => onStatus(r.id, "accepted")}>Подтвердить</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onStatus(r.id, "declined")}>Отклонить</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Панель заказчика */}
      <div className="card card-pad">
        <h3 className="h2" style={{ fontSize: "1.05rem", marginTop: 0 }}>🔎 Панель заказчика</h3>
        {clients.length === 0 ? (
          <p className="muted">Пока нет заказчиков (никто не отправлял запросы).</p>
        ) : (
          <>
            <select className="select" value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ marginBottom: 12 }}>
              {clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <strong style={{ fontSize: "0.9rem" }}>Отправленные запросы ({clientRequests.length}):</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {clientRequests.map((r) => {
                const sp2 = maps.spById[r.specialist_id];
                const c = maps.contactsBySp[r.specialist_id];
                return (
                  <div key={r.id} style={{ padding: "8px 10px", borderRadius: 10, background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span>{sp2?.name ?? r.specialist_id}</span>
                      <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                    </div>
                    {r.status === "accepted" && c && <div className="muted" style={{ fontSize: "0.82rem", marginTop: 4 }}>☎ {c.phone} · {c.whatsapp} {c.instagram}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
