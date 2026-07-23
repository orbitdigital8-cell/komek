import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import VideoCard from "@/components/VideoCard";
import ContactPanel from "@/components/ContactPanel";
import Stars from "@/components/Stars";
import ShortlistButton from "@/components/ShortlistButton";
import ReviewsList from "@/components/ReviewsList";
import SocialLinks from "@/components/SocialLinks";
import { supabaseServer } from "@/lib/supabase/server";
import { fieldsFor, formatAttr } from "@/lib/fields";
import { makeT, profName, type Lang } from "@/lib/i18n";
import { formatDate, type BusyDate, type Profession, type Review, type Social, type Specialist } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SpecialistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);
  const sb = await supabaseServer();
  const { data: specialist } = await sb.from("specialists").select("*").eq("id", id).maybeSingle();
  if (!specialist) notFound();
  const s = specialist as Specialist;

  const { data: prof } = await sb.from("professions").select("*").eq("id", s.profession).maybeSingle();
  const p = prof as Profession | null;

  const { data: reviewsData } = await sb
    .from("reviews")
    .select("*")
    .eq("specialist_id", s.id)
    .order("created_at", { ascending: false });
  const reviews = (reviewsData as Review[]) ?? [];

  // Анонимный запрос вернёт только публичные соцсети (RLS), скрытые — в панели контактов
  const { data: socialsData } = await sb
    .from("specialist_socials")
    .select("*")
    .eq("specialist_id", s.id)
    .order("sort_order");
  const publicSocials = (socialsData as Social[]) ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const { data: busyData } = await sb
    .from("specialist_busy")
    .select("specialist_id, busy_date, note")
    .eq("specialist_id", s.id)
    .gte("busy_date", today)
    .order("busy_date");
  const busy = (busyData as BusyDate[]) ?? [];
  const busyDates = busy.map((b) => b.busy_date);

  const images = s.gallery.length ? s.gallery : s.avatar_url ? [s.avatar_url] : [];

  return (
    <div className="container" style={{ padding: "24px 20px 0" }}>
      <Link href="/" className="link" style={{ fontSize: "0.9rem" }}>← {t("Каталог")}</Link>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 28, marginTop: 16, alignItems: "start" }} className="profile-grid">
        {/* Левая колонка */}
        <div style={{ minWidth: 0 }}>
          {/* Шапка */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.avatar_url} alt={s.name} className="avatar" style={{ width: 72, height: 72 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 className="h2" style={{ margin: 0 }}>{s.name}</h1>
                {s.verified && <span className="badge badge-verified">✔ {t("Проверен")}</span>}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Stars rating={s.rating} size={15} />
                  <span className="muted" style={{ fontSize: "0.85rem" }}>
                    {s.review_count > 0 ? `${s.review_count} ${t("отзыв(ов)")}` : t("нет отзывов")}
                  </span>
                </span>
              </div>
              <div className="soft" style={{ marginTop: 4 }}>
                <span className="badge badge-soft" style={{ marginRight: 8 }}>{p?.emoji} {profName(p, lang) || s.profession}</span>
                📍 {s.city} · {t("опыт")} {s.experience_years} {t("лет")}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <ShortlistButton id={s.id} variant="button" />
            </div>
          </div>

          {images.length > 0 && <Gallery images={images} name={s.name} />}

          <div style={{ marginTop: 22 }}>
            <h3 className="h2" style={{ fontSize: "1.15rem", marginBottom: 10 }}>🎬 {t("Видео-визитка")}</h3>
            {s.video_url ? (
              <VideoCard url={s.video_url} />
            ) : (
              <div className="card card-pad" style={{ textAlign: "center", color: "var(--text-mute)" }}>
                {t("Видео-визитка пока не добавлена.")}
              </div>
            )}
          </div>

          {(() => {
            const rows = fieldsFor(s.profession)
              .map((f) => ({ label: t(f.label), val: formatAttr(f, s.attributes?.[f.key], t) }))
              .filter((r) => r.val);
            if (rows.length === 0) return null;
            return (
              <div style={{ marginTop: 20 }}>
                <h3 className="h2" style={{ fontSize: "1.15rem", marginBottom: 10 }}>{t("Характеристики")}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                  {rows.map((r) => (
                    <div key={r.label} className="card" style={{ padding: "10px 14px" }}>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>{r.label}</div>
                      <strong style={{ fontSize: "0.95rem" }}>{r.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div style={{ marginTop: 22 }}>
            <h3 className="h2" style={{ fontSize: "1.15rem", marginBottom: 8 }}>{t("О специалисте")}</h3>
            <p style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{s.about || s.tagline}</p>
          </div>

          {s.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
              {s.tags.map((tg) => (
                <span key={tg} className="chip" style={{ cursor: "default", fontSize: "0.82rem" }}>#{tg}</span>
              ))}
            </div>
          )}

          {publicSocials.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <h3 className="h2" style={{ fontSize: "1.15rem", marginBottom: 10 }}>{t("Соцсети")}</h3>
              <SocialLinks socials={publicSocials} />
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <h3 className="h2" style={{ fontSize: "1.15rem", marginBottom: 10 }}>📅 {t("Занятость")}</h3>
            {busy.length === 0 ? (
              <div className="card card-pad" style={{ color: "var(--good)", display: "flex", alignItems: "center", gap: 8 }}>
                {t("✓ Свободных дат много — уточните нужный день в запросе.")}
              </div>
            ) : (
              <div className="card card-pad">
                <p className="soft" style={{ margin: "0 0 10px", fontSize: "0.9rem" }}>{t("Ближайшие занятые дни:")}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {busy.slice(0, 12).map((b) => (
                    <span key={b.busy_date} className="badge badge-declined" title={b.note}>
                      {formatDate(b.busy_date)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 26 }}>
            <h3 className="h2" style={{ fontSize: "1.15rem", marginBottom: 12 }}>
              {t("Отзывы")} {s.review_count > 0 && <span className="muted" style={{ fontWeight: 400 }}>· {s.rating.toFixed(1)} ★</span>}
            </h3>
            <ReviewsList reviews={reviews} />
          </div>
        </div>

        {/* Правая колонка — контакты */}
        <ContactPanel specialist={s} busyDates={busyDates} />
      </div>
    </div>
  );
}
