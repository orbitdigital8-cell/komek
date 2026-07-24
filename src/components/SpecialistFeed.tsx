"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { profName } from "@/lib/i18n";
import { formatDate, loyaltyLevel, type OpenRequest, type Profession, type Specialist } from "@/lib/types";

// Главная для специалиста: его рабочее место — заказы с биржи по его профессии + кабинет.
export default function SpecialistFeed({ professions }: { professions: Profession[] }) {
  const sb = supabaseBrowser();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [sp, setSp] = useState<Specialist | null>(null);
  const [orders, setOrders] = useState<OpenRequest[]>([]);
  const [pending, setPending] = useState(0);
  const [viewsWeek, setViewsWeek] = useState(0);
  const [ready, setReady] = useState(false);

  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await sb.from("specialists").select("*").eq("owner_id", user.id).maybeSingle();
      const spec = (s as Specialist) ?? null;
      setSp(spec);
      if (spec) {
        const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
        const [{ data: reqs }, { count }, { count: views }] = await Promise.all([
          sb.from("open_requests").select("*").eq("status", "open").contains("professions", [spec.profession]).order("created_at", { ascending: false }).limit(6),
          sb.from("contact_requests").select("id", { count: "exact", head: true }).eq("specialist_id", spec.id).eq("status", "pending"),
          sb.from("profile_views").select("id", { count: "exact", head: true }).eq("specialist_id", spec.id).gte("viewed_at", weekAgo),
        ]);
        setOrders((reqs as OpenRequest[]) ?? []);
        setPending(count ?? 0);
        setViewsWeek(views ?? 0);
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!ready) return <div className="container" style={{ padding: 40 }} />;

  return (
    <div className="container" style={{ padding: "32px 22px 0" }}>
      {/* Пульс анкеты — информация, которой нет в навигации */}
      {sp && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
          {(() => {
            const lvl = loyaltyLevel(sp.orders_count);
            const cards = [
              { label: t("Новые заявки"), value: pending, sub: pending > 0 ? t("ждут ответа") : t("всё обработано"), href: "/dashboard" },
              { label: t("Просмотры анкеты"), value: viewsWeek, sub: t("за неделю"), href: `/s/${sp.id}` },
              { label: t("Выполнено заказов"), value: sp.orders_count, sub: lvl ? `${lvl.emoji} ${t(lvl.label)}` : t("до уровня") + " 10", href: "/dashboard" },
              { label: t("Рейтинг"), value: sp.rating.toFixed(1), sub: `${sp.review_count} ${t("отзыв(ов)")}`, href: `/s/${sp.id}` },
            ];
            return cards.map((c) => (
              <Link key={c.label} href={c.href} className="card card-pad lift" style={{ textDecoration: "none" }}>
                <div className="muted" style={{ fontSize: "0.8rem" }}>{c.label}</div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--brand)" }}>{c.value}</div>
                <div className="soft" style={{ fontSize: "0.76rem" }}>{c.sub}</div>
              </Link>
            ));
          })()}
        </div>
      )}

      {/* Заказы для вас — по вашей профессии */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 className="h2" style={{ fontSize: "1.35rem", margin: 0 }}>
          🔔 {t("Заказы для вас")} {sp && <span className="soft" style={{ fontWeight: 400, fontSize: "1rem" }}>· {profName(profMap[sp.profession], lang)}</span>}
        </h2>
        <Link href="/orders" className="link" style={{ fontSize: "0.9rem" }}>{t("Все заказы")} →</Link>
      </div>

      {!sp ? (
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <p className="soft" style={{ marginBottom: 12 }}>{t("Заполните анкету, чтобы получать заказы по вашей специальности.")}</p>
          <Link href="/dashboard" className="btn btn-primary">{t("Заполнить анкету")}</Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="card card-pad" style={{ color: "var(--text-mute)" }}>{t("Пока нет новых заказов по вашей специальности — заглядывайте позже.")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((r) => (
            <Link key={r.id} href="/orders" className="card card-pad lift" style={{ textDecoration: "none" }}>
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
              </div>
              {r.details && <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>{r.details}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
