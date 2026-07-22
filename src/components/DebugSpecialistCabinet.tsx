"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProfileEditor from "@/components/dashboard/ProfileEditor";
import BrandIcon from "@/components/BrandIcon";
import Chat from "@/components/Chat";
import { formatDate, priceLabel, STATUS_BADGE, STATUS_LABEL, type BusyDate, type ContactRequest, type Profession, type RequestStatus, type Social, type Specialist, type SpecialistContacts } from "@/lib/types";

export default function DebugSpecialistCabinet({ specialistId }: { specialistId: string }) {
  const [sp, setSp] = useState<Specialist | null>(null);
  const [prof, setProf] = useState<Profession | null>(null);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [busy, setBusy] = useState<BusyDate[]>([]);
  const [contacts, setContacts] = useState<SpecialistContacts | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/data", { cache: "no-store" });
    if (!r.ok) { setLoading(false); return; }
    const d = await r.json();
    const s = (d.specialists ?? []).find((x: Specialist) => x.id === specialistId) ?? null;
    setSp(s);
    setProfessions((d.professions ?? []) as Profession[]);
    setProf((d.professions ?? []).find((p: Profession) => p.id === s?.profession) ?? null);
    setRequests((d.requests ?? []).filter((x: ContactRequest) => x.specialist_id === specialistId));
    setBusy((d.busy ?? []).filter((b: BusyDate) => b.specialist_id === specialistId).sort((a: BusyDate, b: BusyDate) => a.busy_date.localeCompare(b.busy_date)));
    setContacts((d.contacts ?? []).find((c: SpecialistContacts) => c.specialist_id === specialistId) ?? null);
    setSocials((d.socials ?? []).filter((x: Social) => x.specialist_id === specialistId));
    setLoading(false);
  }, [specialistId]);

  useEffect(() => { if (specialistId) load(); else setLoading(false); }, [specialistId, load]);

  async function setStatus(id: string, status: RequestStatus) {
    await fetch("/api/admin/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  }

  if (!specialistId) return <div className="container" style={{ padding: 40 }}><div className="card card-pad muted">Выберите специалиста в панели отладки сверху.</div></div>;
  if (loading) return <div className="container" style={{ padding: 40 }}>Загрузка…</div>;
  if (!sp) return <div className="container" style={{ padding: 40 }}><div className="card card-pad muted">Специалист не найден.</div></div>;

  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="container" style={{ padding: "26px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sp.avatar_url} alt="" className="avatar" style={{ width: 56, height: 56 }} />
        <div>
          <h1 className="h2" style={{ margin: 0 }}>{sp.name} <span className="badge badge-mute">кабинет · отладка</span></h1>
          <div className="soft" style={{ fontSize: "0.88rem" }}>{prof?.emoji} {prof?.label} · 📍 {sp.city} · {priceLabel(sp.price_from)} · ★ {sp.rating} ({sp.review_count})</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className={`btn btn-sm ${editing ? "btn-outline" : "btn-primary"}`} onClick={() => setEditing((e) => !e)}>
            {editing ? "← Назад к кабинету" : "✏ Редактировать анкету"}
          </button>
          <Link href={`/s/${sp.id}`} className="btn btn-outline btn-sm">Открыть ↗</Link>
        </div>
      </div>

      {editing ? (
        <ProfileEditor
          userId="admin"
          adminSpecialistId={sp.id}
          professions={professions}
          specialist={sp}
          contacts={contacts}
          socials={socials}
          onSaved={load}
        />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 16 }} className="editor-grid">
        {/* Входящие заявки */}
        <div className="card card-pad">
          <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>
            Входящие заявки {pending > 0 && <span className="pill-count">{pending}</span>}
          </h3>
          {requests.length === 0 ? (
            <div className="muted">Пока нет заявок на связь.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {requests.map((r) => (
                <div key={r.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--surface-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <strong>{r.client_name || "Заказчик"} {r.client_phone && <span className="muted" style={{ fontWeight: 400 }}>· {r.client_phone}</span>}</strong>
                    <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <div className="muted" style={{ fontSize: "0.84rem", marginTop: 2 }}>{r.event_date ? `📅 ${r.event_date}` : "дата не указана"}</div>
                  {r.message && <p className="soft" style={{ fontSize: "0.88rem", margin: "6px 0 0" }}>{r.message}</p>}
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {r.status === "pending" && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => setStatus(r.id, "accepted")}>✓ Подтвердить</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, "declined")}>Отклонить</button>
                      </>
                    )}
                    {r.status === "accepted" && <button className="btn btn-primary btn-sm" onClick={() => setStatus(r.id, "booked")}>📅 Забронировать</button>}
                    {r.status === "booked" && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => setStatus(r.id, "completed")}>✓ Выполнен</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, "accepted")}>Отменить бронь</button>
                      </>
                    )}
                    {r.status === "completed" && <span className="badge badge-completed">✓ Выполнен</span>}
                    {r.status === "declined" && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, "pending")}>↺ Вернуть</button>}
                    <button className="btn btn-outline btn-sm" onClick={() => setOpenChat(openChat === r.id ? null : r.id)}>
                      {openChat === r.id ? "Скрыть чат" : "💬 Чат"}
                    </button>
                  </div>
                  {openChat === r.id && (
                    <div style={{ marginTop: 10 }}>
                      <Chat requestId={r.id} peerName={r.client_name} adminSenderId={sp.owner_id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Занятость + контакты */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card card-pad">
            <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>Занятость</h3>
            {busy.length === 0 ? <div className="muted">Нет занятых дат.</div> : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {busy.map((b) => <span key={b.busy_date} className="badge badge-declined" title={b.note}>{formatDate(b.busy_date)}</span>)}
              </div>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>Контакты</h3>
            {contacts ? (
              <div className="soft" style={{ fontSize: "0.9rem", lineHeight: 1.9 }}>
                {contacts.phone && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BrandIcon type="phone" size={16} /> {contacts.phone}</div>}
                {contacts.whatsapp && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BrandIcon type="whatsapp" size={16} /> {contacts.whatsapp}</div>}
                {contacts.telegram && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BrandIcon type="telegram" size={16} /> {contacts.telegram}</div>}
              </div>
            ) : <div className="muted">Контакты не заполнены.</div>}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
