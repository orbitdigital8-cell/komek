"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useShortlist } from "@/lib/shortlist";
import { useNotifications } from "@/lib/useNotifications";

export default function Header() {
  const { user, role, name, loading, signOut } = useAuth();
  const { ids, ready } = useShortlist();
  const { total } = useNotifications();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

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

        <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          {ready && ids.length > 0 && (
            <Link href="/shortlist" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              ❤️ <span className="pill-count" style={{ background: "var(--brand)" }}>{ids.length}</span>
            </Link>
          )}

          {loading ? null : !user ? (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Войти
              </Link>
              <Link href="/register?role=specialist" className="btn btn-primary btn-sm">
                <span className="cta-full">Разместить анкету</span>
                <span className="cta-short">Анкета</span>
              </Link>
            </>
          ) : (
            <>
              {role === "specialist" && (
                <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Моя анкета
                  {total > 0 && <span className="pill-count">{total}</span>}
                </Link>
              )}
              {role === "client" && (
                <Link href="/requests" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Мои запросы
                  {total > 0 && <span className="pill-count">{total}</span>}
                </Link>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
                <span
                  className="badge badge-soft"
                  title={role === "specialist" ? "Специалист" : role === "admin" ? "Админ" : "Заказчик"}
                >
                  {name || (role === "specialist" ? "Специалист" : "Заказчик")}
                </span>
                <button onClick={handleSignOut} className="btn btn-outline btn-sm">
                  Выйти
                </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
