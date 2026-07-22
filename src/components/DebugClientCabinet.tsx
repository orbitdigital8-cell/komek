"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BrandIcon from "@/components/BrandIcon";
import Chat from "@/components/Chat";
import { STATUS_BADGE, STATUS_LABEL, type ContactRequest, type Specialist, type SpecialistContacts } from "@/lib/types";

export default function DebugClientCabinet({ clientId }: { clientId: string }) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [spById, setSpById] = useState<Record<string, Specialist>>({});
  const [contactsBySp, setContactsBySp] = useState<Record<string, SpecialistContacts>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/data", { cache: "no-store" });
    if (!r.ok) { setLoading(false); return; }
    const d = await r.json();
    const reqs = (d.requests ?? []).filter((x: ContactRequest) => x.client_id === clientId);
    setRequests(reqs);
    setName(reqs[0]?.client_name || (d.profiles ?? []).find((p: { id: string }) => p.id === clientId)?.full_name || "Заказчик");
    const sm: Record<string, Specialist> = {};
    for (const s of d.specialists ?? []) sm[s.id] = s;
    setSpById(sm);
    const cm: Record<string, SpecialistContacts> = {};
    for (const c of d.contacts ?? []) cm[c.specialist_id] = c;
    setContactsBySp(cm);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { if (clientId) load(); else setLoading(false); }, [clientId, load]);

  if (!clientId) return <div className="container" style={{ padding: 40 }}><div className="card card-pad muted">Выберите заказчика в панели отладки сверху. Если список пуст — сначала кто-то должен отправить запрос.</div></div>;
  if (loading) return <div className="container" style={{ padding: 40 }}>Загрузка…</div>;

  return (
    <div className="container-narrow" style={{ padding: "26px 22px" }}>
      <h1 className="h2" style={{ marginBottom: 4 }}>Мои запросы <span className="badge badge-mute">{name} · отладка</span></h1>
      <p className="soft" style={{ marginBottom: 20 }}>Запросы заказчика и открытые контакты.</p>

      {requests.length === 0 ? (
        <div className="card card-pad muted">У этого заказчика нет запросов.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {requests.map((r) => {
            const sp = spById[r.specialist_id];
            const c = contactsBySp[r.specialist_id];
            return (
              <div key={r.id} className="card card-pad">
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sp?.avatar_url} alt="" className="avatar" style={{ width: 48, height: 48 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/s/${r.specialist_id}`} className="link">{sp?.name ?? r.specialist_id}</Link>
                    <div className="muted" style={{ fontSize: "0.85rem" }}>📍 {sp?.city}{r.event_date ? ` · ${r.event_date}` : ""}</div>
                  </div>
                  <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setOpenChat(openChat === r.id ? null : r.id)}>
                    {openChat === r.id ? "Скрыть чат" : "💬 Чат"}
                  </button>
                  {openChat === r.id && (
                    <div style={{ marginTop: 10 }}>
                      <Chat requestId={r.id} peerName={sp?.name} adminSenderId={clientId} />
                    </div>
                  )}
                </div>

                {["accepted", "booked", "completed"].includes(r.status) && c && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {c.phone && <span className="chip" style={{ gap: 7 }}><BrandIcon type="phone" size={16} /> {c.phone}</span>}
                    {c.whatsapp && <span className="chip" style={{ gap: 7 }}><BrandIcon type="whatsapp" size={16} /> {c.whatsapp}</span>}
                    {c.telegram && <span className="chip" style={{ gap: 7 }}><BrandIcon type="telegram" size={16} /> {c.telegram}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
