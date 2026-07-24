"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useShortlist } from "@/lib/shortlist";
import { useLang } from "@/lib/lang";
import NotifBell from "@/components/NotifBell";

export default function Header() {
  const { user, role, name, loading, signOut } = useAuth();
  const { ids, ready } = useShortlist();
  const { lang, setLang, t } = useLang();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const langBtn = (l: "ru" | "kk", label: string) => (
    <button
      onClick={() => setLang(l)}
      style={{
        padding: "3px 8px",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        fontSize: "0.78rem",
        fontWeight: 700,
        background: lang === l ? "var(--brand)" : "transparent",
        color: lang === l ? "#fff" : "var(--text-mute)",
      }}
    >
      {label}
    </button>
  );

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(255,253,249,0.82)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 64 }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: "1.2rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--brand), var(--brand-500))",
              color: "#fff",
              fontSize: 18,
            }}
          >
            ✦
          </span>
          <span>
            Kö<span style={{ color: "var(--brand)" }}>mek</span>
          </span>
        </Link>

        {/* Переключатель языка */}
        <span style={{ display: "inline-flex", gap: 2, padding: 2, background: "var(--surface-2)", borderRadius: 9 }}>
          {langBtn("ru", "RU")}
          {langBtn("kk", "ҚЗ")}
        </span>

        <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <Link href="/orders" className="btn btn-ghost btn-sm">
            {role === "specialist" ? (
              <>
                <span className="cta-full">{t("Заказы на бирже")}</span>
                <span className="cta-short">{t("Заказы")}</span>
              </>
            ) : (
              <>
                <span className="cta-full">{t("Подать заявку")}</span>
                <span className="cta-short">{t("Заявка")}</span>
              </>
            )}
          </Link>
          {ready && ids.length > 0 && (
            <Link href="/shortlist" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              ❤️ <span className="pill-count" style={{ background: "var(--brand)" }}>{ids.length}</span>
            </Link>
          )}

          {loading ? null : !user ? (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                {t("Войти")}
              </Link>
              <Link href="/register?role=specialist" className="btn btn-primary btn-sm">
                <span className="cta-full">{t("Разместить анкету")}</span>
                <span className="cta-short">{t("Анкета")}</span>
              </Link>
            </>
          ) : (
            <>
              {role === "specialist" && (
                <Link href="/dashboard" className="btn btn-ghost btn-sm">{t("Моя анкета")}</Link>
              )}
              {role === "client" && (
                <Link href="/requests" className="btn btn-ghost btn-sm">{t("Мои запросы")}</Link>
              )}
              <NotifBell />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
                <span
                  className="badge badge-soft"
                  title={role === "specialist" ? t("Специалист") : role === "admin" ? t("Админ") : t("Заказчик")}
                >
                  {name || (role === "specialist" ? t("Специалист") : t("Заказчик"))}
                </span>
                <button onClick={handleSignOut} className="btn btn-outline btn-sm">
                  {t("Выйти")}
                </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
