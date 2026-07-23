import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ShortlistProvider } from "@/lib/shortlist";
import { PersonaProvider } from "@/lib/persona";
import { LangProvider } from "@/lib/lang";
import { makeT, type Lang } from "@/lib/i18n";
import Header from "@/components/Header";
import ShortlistBar from "@/components/ShortlistBar";
import DebugBar from "@/components/DebugBar";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Kömek — специалисты для мероприятий и дома",
  description:
    "Kömek — каталог тамада, ведущих, аниматоров, диджеев, фотографов, а также нянь, домработниц и водителей. Найдите нужного специалиста для тоя, праздника или дома.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang: Lang = cookieStore.get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);

  return (
    <html lang={lang === "kk" ? "kk" : "ru"} className={manrope.variable}>
      <body>
        <AuthProvider>
          <ShortlistProvider>
          <PersonaProvider>
          <LangProvider initial={lang}>
            <Header />
            <DebugBar />
            <main>{children}</main>
            <ShortlistBar />
          <footer style={{ borderTop: "1px solid var(--border)", marginTop: 64, padding: "28px 0" }}>
            {/* Популярные запросы — SEO-перелинковка */}
            <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 16, fontSize: "0.84rem" }}>
              <Link href="/c/tamada" className="link" style={{ color: "var(--text-mute)" }}>{t("Тамада в Алматы")}</Link>
              <Link href="/c/photographer" className="link" style={{ color: "var(--text-mute)" }}>{t("Фотограф на той")}</Link>
              <Link href="/c/singer" className="link" style={{ color: "var(--text-mute)" }}>{t("Певец на свадьбу")}</Link>
              <Link href="/c/animator" className="link" style={{ color: "var(--text-mute)" }}>{t("Аниматор на детский праздник")}</Link>
              <Link href="/c/nanny" className="link" style={{ color: "var(--text-mute)" }}>{t("Няня на мероприятие")}</Link>
              <Link href="/c/pyro" className="link" style={{ color: "var(--text-mute)" }}>{t("Салют и фейерверк")}</Link>
              <Link href="/orders" className="link" style={{ color: "var(--text-mute)" }}>{t("Подать заявку на специалиста")}</Link>
              <Link href="/how" className="link" style={{ color: "var(--text-mute)" }}>{t("Как это работает")}</Link>
            </div>
            <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, color: "var(--text-mute)", fontSize: "0.88rem" }}>
              <span>{t("© 2026 Kömek — маркетплейс специалистов для мероприятий и дома")}</span>
              <span style={{ display: "flex", gap: 14 }}>
                {t("Казахстан · демо-версия")}
                {process.env.ADMIN_DEBUG === "1" && <Link href="/admin" className="link">⚙ {t("Админ")}</Link>}
              </span>
            </div>
          </footer>
          </LangProvider>
          </PersonaProvider>
          </ShortlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
