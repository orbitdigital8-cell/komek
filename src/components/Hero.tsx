"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import type { Lang } from "@/lib/i18n";

// Ролевой hero: специалисту — приветствие и вход в работу, остальным — витрина.
export default function Hero({ lang }: { lang: Lang }) {
  const { user, role, name, loading } = useAuth();
  const { t } = useLang();
  const isSpecialist = !loading && role === "specialist";

  if (isSpecialist) {
    return (
      <div className="container" style={{ position: "relative", padding: "56px 22px 40px", textAlign: "center" }}>
        <span className="badge badge-soft" style={{ marginBottom: 18, padding: "7px 16px", fontSize: "0.82rem" }}>
          ⭐ {t("Кабинет специалиста")}
        </span>
        <h1 className="h1" style={{ maxWidth: 820, margin: "0 auto 18px" }}>
          {name ? `${t("С возвращением")}, ` : t("С возвращением")}
          {name && <span className="gradient-text">{name}</span>}!
        </h1>
        <p className="lead" style={{ maxWidth: 560, margin: "0 auto" }}>
          {t("Заявки, заказы с биржи и статистика — всё в одном месте. Не пропускайте новых клиентов.")}
        </p>
      </div>
    );
  }

  const second = !loading && !user
    ? <Link href="/register?role=specialist" className="btn btn-outline">{t("Я специалист — разместить анкету")}</Link>
    : null;

  return (
    <div className="container" style={{ position: "relative", padding: "64px 22px 52px", textAlign: "center" }}>
      <span className="badge badge-soft" style={{ marginBottom: 18, padding: "7px 16px", fontSize: "0.82rem" }}>
        ✦ {t("Kömek — нужный специалист под любой случай")}
      </span>
      <h1 className="h1" style={{ maxWidth: 860, margin: "0 auto 18px" }}>
        {lang === "kk" ? (
          <><span className="gradient-text">Тойға, мерекеге</span> және үйге маман табыңыз</>
        ) : (
          <>Найдите специалиста для <span className="gradient-text">тоя, праздника</span> и дома</>
        )}
      </h1>
      <p className="lead" style={{ maxWidth: 600, margin: "0 auto 28px" }}>
        {t("Тамада, ведущие, артисты, фотографы — для праздника. Няни, домработницы и водители — для дома. Смотрите видео-визитки и портфолио, связывайтесь напрямую.")}
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
        <a href="#services" className="btn btn-primary btn-lg" style={{ fontSize: "1.05rem", padding: "14px 28px", boxShadow: "0 8px 24px rgba(147,51,234,.32)" }}>✨ {t("Подобрать по шагам")}</a>
        <a href="#catalog" className="btn btn-outline">{t("Смотреть каталог")}</a>
        {second}
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/how" className="link" style={{ fontSize: "0.92rem" }}>{t("Как это работает")} →</Link>
      </div>

      <div style={{ display: "flex", gap: 26, justifyContent: "center", flexWrap: "wrap", marginTop: 34, color: "var(--text-soft)", fontSize: "0.9rem", fontWeight: 600 }}>
        <span>🎯 {t("20+ специальностей")}</span>
        <span>⭐ {t("Отзывы от реальных клиентов")}</span>
        <span>🔒 {t("Контакты — после подтверждения")}</span>
      </div>
    </div>
  );
}
