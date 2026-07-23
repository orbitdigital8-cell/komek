"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePersona } from "@/lib/persona";
import { useUnread } from "@/lib/useUnread";
import { useLang } from "@/lib/lang";
import ReviewForm from "@/components/ReviewForm";
import DebugClientCabinet from "@/components/DebugClientCabinet";
import Chat from "@/components/Chat";
import BrandIcon from "@/components/BrandIcon";
import { STATUS_BADGE, STATUS_LABEL, whatsappLink, type ContactRequest, type SpecialistContacts, type Specialist } from "@/lib/types";

const OPEN_STATUSES = ["accepted", "booked", "completed"];

type Row = ContactRequest & { specialist: Specialist | null; contacts?: SpecialistContacts | null };

export default function RequestsPage() {
  const sb = supabaseBrowser();
  const { user, loading } = useAuth();
  const persona = usePersona();
  const { t } = useLang();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const { unread, refresh: refreshUnread } = useUnread(rows.map((r) => r.id));

  useEffect(() => { if (!openChat) refreshUnread(); }, [openChat, refreshUnread]);

  const debugOn = persona.ready && persona.active; // отладка включена — не требуем входа

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await sb
      .from("contact_requests")
      .select("*, specialist:specialists(*)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    const list = (data as Row[]) ?? [];
    // Контакты открыты на всех «открытых» статусах (accepted/booked/completed)
    const opened = list.filter((r) => OPEN_STATUSES.includes(r.status)).map((r) => r.specialist_id);
    if (opened.length) {
      const { data: cs } = await sb.from("specialist_contacts").select("*").in("specialist_id", opened);
      const map = new Map((cs as SpecialistContacts[] | null)?.map((c) => [c.specialist_id, c]) ?? []);
      for (const r of list) if (OPEN_STATUSES.includes(r.status)) r.contacts = map.get(r.specialist_id) ?? null;
    }
    setRows(list);
    setReady(true);
  }, [sb, user]);

  useEffect(() => {
    if (debugOn) return; // режим отладки — никогда не требуем входа
    if (loading) return;
    if (!user) {
      router.push("/login?next=/requests");
      return;
    }
    load();
  }, [debugOn, loading, user, load, router]);

  // Отладка: смотрим запросы выбранного заказчика
  if (debugOn) return <DebugClientCabinet clientId={persona.clientId} />;

  if (loading || !ready) return <div className="container" style={{ padding: 48 }} />;

  return (
    <div className="container-narrow" style={{ padding: "32px 20px" }}>
      <h1 className="h2" style={{ marginBottom: 6 }}>{t("Мои запросы")}</h1>
      <p className="soft" style={{ marginBottom: 22 }}>{t("Запросы на связь и открытые контакты специалистов.")}</p>

      {rows.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--text-mute)" }}>
          {t("Пока нет запросов.")} <Link href="/" className="link">{t("Найти специалиста →")}</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map((r) => (
            <div key={r.id} className="card card-pad">
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.specialist?.avatar_url} alt="" className="avatar" style={{ width: 52, height: 52 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/s/${r.specialist_id}`} className="link" style={{ fontSize: "1.05rem" }}>
                    {r.specialist?.name ?? t("Специалист")}
                  </Link>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    📍 {r.specialist?.city}
                    {r.event_date ? ` · ${t("дата:")} ${r.event_date}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setOpenChat(openChat === r.id ? null : r.id)} style={{ position: "relative" }}>
                    {openChat === r.id ? t("Скрыть чат") : `💬 ${t("Чат")}`}
                    {unread.has(r.id) && openChat !== r.id && (
                      <span className="pill-count" style={{ marginLeft: 6 }}>{t("новое")}</span>
                    )}
                  </button>
                  <span className={`badge ${STATUS_BADGE[r.status]}`}>{t(STATUS_LABEL[r.status])}</span>
                </div>
              </div>

              {openChat === r.id && (
                <div style={{ marginTop: 12 }}>
                  <Chat requestId={r.id} peerName={r.specialist?.name} />
                </div>
              )}

              {OPEN_STATUSES.includes(r.status) && r.contacts && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  {r.contacts.whatsapp && (
                    <a href={whatsappLink(r.contacts.whatsapp, `Здравствуйте! Пишу с Kömek${r.event_date ? ` по поводу мероприятия ${r.event_date}` : ""}.`)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#fff" }}>
                      💬 {t("Написать в WhatsApp")}
                    </a>
                  )}
                  {r.contacts.phone && <ContactPill type="phone" value={r.contacts.phone} href={`tel:${r.contacts.phone.replace(/\s/g, "")}`} />}
                  {r.contacts.telegram && <ContactPill type="telegram" value={r.contacts.telegram} href={`https://t.me/${r.contacts.telegram.replace(/^@/, "")}`} />}
                </div>
              )}

              {r.status === "pending" && (
                <p className="soft" style={{ fontSize: "0.86rem", marginTop: 10, marginBottom: 0 }}>
                  {t("Ожидаем подтверждения. Контакты откроются после него — а обсудить детали можно уже сейчас в чате.")}
                </p>
              )}

              {r.status === "completed" && (
                <div style={{ marginTop: 10 }}>
                  <div className="badge badge-completed" style={{ marginBottom: 8 }}>{t("✓ Заказ выполнен — оставьте отзыв")}</div>
                  <ReviewForm specialistId={r.specialist_id} defaultName={r.client_name} />
                </div>
              )}
              {(r.status === "accepted" || r.status === "booked") && (
                <ReviewForm specialistId={r.specialist_id} defaultName={r.client_name} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactPill({ type, value, href }: { type: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="chip" style={{ cursor: "pointer", gap: 7 }}>
      <BrandIcon type={type} size={16} /> {value}
    </a>
  );
}
