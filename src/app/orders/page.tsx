"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePersona } from "@/lib/persona";
import { useLang } from "@/lib/lang";
import { profName, priceLabelL } from "@/lib/i18n";
import { formatDate, type OpenRequest, type OpenRequestBid, type Profession, type Specialist } from "@/lib/types";

type BidRow = OpenRequestBid & { specialist?: Specialist | null };

export default function OrdersPage() {
  const sb = supabaseBrowser();
  const { user, role } = useAuth();
  const persona = usePersona();
  const { lang, t } = useLang();

  const debugOn = persona.ready && persona.active;
  const asClient = debugOn ? persona.role === "client" : role === "client";
  const asSpecialist = debugOn ? persona.role === "specialist" : role === "specialist";
  const clientId = debugOn ? persona.clientId : user?.id ?? null;

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [requests, setRequests] = useState<OpenRequest[]>([]);
  const [bids, setBids] = useState<Record<string, BidRow[]>>({});
  const [mySpecialist, setMySpecialist] = useState<Specialist | null>(null);
  const [ready, setReady] = useState(false);

  // Форма создания
  const [formOpen, setFormOpen] = useState(false);
  const [selProfs, setSelProfs] = useState<string[]>([]);
  const [city, setCity] = useState("Алматы");
  const [eventDate, setEventDate] = useState("");
  const [budget, setBudget] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  // Форма отклика
  const [bidFor, setBidFor] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidMsg, setBidMsg] = useState("");

  const profMap = useMemo(() => {
    const m: Record<string, Profession> = {};
    for (const p of professions) m[p.id] = p;
    return m;
  }, [professions]);

  const load = useCallback(async () => {
    const [{ data: profs }, { data: reqs }] = await Promise.all([
      sb.from("professions").select("*").order("sort_order"),
      sb.from("open_requests").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50),
    ]);
    setProfessions((profs as Profession[]) ?? []);
    const list = (reqs as OpenRequest[]) ?? [];
    setRequests(list);

    if (list.length) {
      const { data: bs } = await sb
        .from("open_request_bids")
        .select("*, specialist:specialists(*)")
        .in("request_id", list.map((r) => r.id))
        .order("created_at");
      const map: Record<string, BidRow[]> = {};
      for (const b of (bs as BidRow[]) ?? []) (map[b.request_id] ??= []).push(b);
      setBids(map);
    }
    setReady(true);
  }, [sb]);

  useEffect(() => { load(); }, [load]);

  // Анкета текущего специалиста (для отклика)
  useEffect(() => {
    (async () => {
      if (debugOn && persona.role === "specialist" && persona.specialistId) {
        const { data } = await sb.from("specialists").select("*").eq("id", persona.specialistId).maybeSingle();
        setMySpecialist((data as Specialist) ?? null);
      } else if (user && role === "specialist") {
        const { data } = await sb.from("specialists").select("*").eq("owner_id", user.id).maybeSingle();
        setMySpecialist((data as Specialist) ?? null);
      } else {
        setMySpecialist(null);
      }
    })();
  }, [sb, debugOn, persona.role, persona.specialistId, user, role]);

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selProfs.length) return;
    setBusy(true);
    const payload = {
      professions: selProfs,
      city,
      event_date: eventDate || null,
      budget: budget ? parseInt(budget, 10) : null,
      details,
    };
    if (debugOn) {
      await fetch("/api/admin/openreq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", clientId, clientName: "Заказчик (отладка)", eventDate, budget: payload.budget, details, city, professions: selProfs }),
      });
    } else if (user) {
      await sb.from("open_requests").insert({ ...payload, client_id: user.id, client_name: user.email?.split("@")[0] ?? "Заказчик" });
    }
    setBusy(false);
    setFormOpen(false);
    setSelProfs([]); setDetails(""); setBudget(""); setEventDate("");
    load();
  }

  async function sendBid(requestId: string) {
    if (!mySpecialist) return;
    setBusy(true);
    const price = bidPrice ? parseInt(bidPrice, 10) : null;
    if (debugOn) {
      await fetch("/api/admin/openreq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bid", requestId, specialistId: mySpecialist.id, price, message: bidMsg }),
      });
    } else {
      await sb.from("open_request_bids").upsert(
        { request_id: requestId, specialist_id: mySpecialist.id, price, message: bidMsg },
        { onConflict: "request_id,specialist_id" },
      );
    }
    setBusy(false);
    setBidFor(null); setBidPrice(""); setBidMsg("");
    load();
  }

  async function pickBid(r: OpenRequest, b: BidRow) {
    setBusy(true);
    const msg = `${t("По вашему отклику на бирже")}: «${r.details.slice(0, 80) || profNames(r)}»`;
    if (debugOn) {
      await fetch("/api/admin/openreq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pick", clientId, clientName: r.client_name, specialistId: b.specialist_id, eventDate: r.event_date, message: msg }),
      });
    } else if (user) {
      await sb.from("contact_requests").insert({
        specialist_id: b.specialist_id,
        client_id: user.id,
        client_name: r.client_name,
        client_phone: "",
        event_date: r.event_date,
        message: msg,
      });
    }
    setBusy(false);
    window.location.href = "/requests";
  }

  async function closeRequest(id: string) {
    setBusy(true);
    if (debugOn) {
      await fetch("/api/admin/openreq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close", requestId: id }) });
    } else {
      await sb.from("open_requests").update({ status: "closed" }).eq("id", id);
    }
    setBusy(false);
    load();
  }

  function profNames(r: OpenRequest) {
    return r.professions.map((id) => profName(profMap[id], lang) || id).join(", ");
  }

  const canCreate = asClient || (!debugOn && !!user && role === "client");
  const isMine = (r: OpenRequest) => !!clientId && r.client_id === clientId;
  const canBid = (r: OpenRequest) => asSpecialist && !!mySpecialist && r.professions.includes(mySpecialist.profession);

  if (!ready) return <div className="container" style={{ padding: 48 }} />;

  return (
    <div className="container-narrow" style={{ padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="h2" style={{ marginBottom: 4 }}>
            {asSpecialist ? t("Заявки от заказчиков") : t("Мне нужен специалист")}
          </h1>
          <p className="soft" style={{ margin: 0 }}>
            {asSpecialist
              ? t("Откликайтесь на подходящие заявки — клиент выберет и свяжется с вами.")
              : t("Опишите, кто нужен на ваш той — свободные специалисты откликнутся сами.")}
          </p>
        </div>
        {canCreate ? (
          <button className="btn btn-primary" onClick={() => setFormOpen((v) => !v)}>{formOpen ? t("Скрыть форму") : t("+ Разместить заявку")}</button>
        ) : !asSpecialist ? (
          <Link href="/login?next=/orders" className="btn btn-primary">{t("Войти и разместить заявку")}</Link>
        ) : null}
      </div>

      {/* Создание заявки: можно выбрать сразу несколько категорий — «собрать той» */}
      {formOpen && canCreate && (
        <form onSubmit={createRequest} className="card card-pad" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label className="label">{t("Кто нужен? Можно выбрать несколько — соберём весь той")}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {professions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip ${selProfs.includes(p.id) ? "chip-active" : ""}`}
                  onClick={() => setSelProfs((cur) => (cur.includes(p.id) ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
                >
                  {p.emoji} {profName(p, lang)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="editor-grid">
            <div className="field">
              <label className="label">{t("Город")}</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label">{t("Дата события")}</label>
              <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">{t("Бюджет (₸, на всё)")}</label>
              <input className="input" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">{t("Детали")}</label>
            <textarea className="textarea" placeholder={t("Например: кыз узату на 80 гостей, ресторан «Алтын», нужен ведущий на два языка…")} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={busy || selProfs.length === 0} style={{ alignSelf: "flex-start" }}>{t("Опубликовать заявку")}</button>
        </form>
      )}

      {/* Лента заявок */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
        {requests.length === 0 && (
          <div className="card card-pad" style={{ textAlign: "center", color: "var(--text-mute)" }}>{t("Открытых заявок пока нет.")}</div>
        )}
        {requests.map((r) => {
          const rBids = bids[r.id] ?? [];
          return (
            <div key={r.id} className="card card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.professions.map((pid) => (
                    <span key={pid} className="badge badge-soft">{profMap[pid]?.emoji} {profName(profMap[pid], lang) || pid}</span>
                  ))}
                </div>
                <span className="muted" style={{ fontSize: "0.82rem" }}>{formatDate(r.created_at.slice(0, 10))}</span>
              </div>

              <div className="soft" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                📍 {t(r.city)}
                {r.event_date && <> · 📅 {formatDate(r.event_date, true)}</>}
                {r.budget && <> · 💰 {t("до")} {r.budget.toLocaleString("ru-RU")} ₸</>}
                {r.client_name && <> · {r.client_name}</>}
              </div>
              {r.details && <p style={{ margin: "10px 0 0", lineHeight: 1.55 }}>{r.details}</p>}

              {/* Отклики */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <strong style={{ fontSize: "0.9rem" }}>{t("Отклики")} ({rBids.length})</strong>
                {rBids.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {rBids.map((b) => (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "8px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.specialist?.avatar_url} alt="" className="avatar" style={{ width: 34, height: 34 }} />
                        <Link href={`/s/${b.specialist_id}`} className="link" style={{ fontSize: "0.92rem" }}>{b.specialist?.name ?? t("Специалист")}</Link>
                        <span className="muted" style={{ fontSize: "0.82rem" }}>{profName(profMap[b.specialist?.profession ?? ""], lang)}</span>
                        {b.price != null && <strong style={{ color: "var(--brand)", fontSize: "0.9rem" }}>{priceLabelL(b.price, lang)}</strong>}
                        {b.message && <span className="soft" style={{ fontSize: "0.85rem", flexBasis: "100%" }}>{b.message}</span>}
                        {isMine(r) && (
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => pickBid(r, b)} style={{ marginLeft: "auto" }}>
                            {t("Выбрать и связаться")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {canBid(r) && bidFor !== r.id && !rBids.some((b) => b.specialist_id === mySpecialist?.id) && (
                    <button className="btn btn-outline btn-sm" onClick={() => setBidFor(r.id)}>{t("Откликнуться")}</button>
                  )}
                  {isMine(r) && (
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => closeRequest(r.id)}>{t("Закрыть заявку")}</button>
                  )}
                </div>

                {bidFor === r.id && mySpecialist && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <input className="input" type="number" min={0} placeholder={t("Ваша цена, ₸")} value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} style={{ flex: "0 1 150px" }} />
                    <input className="input" placeholder={t("Короткое сообщение заказчику")} value={bidMsg} onChange={(e) => setBidMsg(e.target.value)} style={{ flex: "1 1 220px" }} />
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => sendBid(r.id)}>{t("Отправить отклик")}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setBidFor(null)}>{t("Отмена")}</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
