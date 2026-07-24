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
import VisitorOnly from "@/components/VisitorOnly";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://komek.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kömek — специалисты для тоя, праздника и дома",
    template: "%s | Kömek",
  },
  description:
    "Kömek — каталог тамада, ведущих, аниматоров, певцов, фотографов, а также нянь, домработниц, поваров и водителей. Найдите и подберите специалиста для тоя, праздника или дома в Казахстане.",
  keywords: ["тамада", "той", "ведущий", "аниматор", "фотограф на той", "няня", "домработница", "повар на выезд", "водитель", "Kömek", "Казахстан", "Алматы", "Астана"],
  applicationName: "Kömek",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Kömek",
    locale: "ru_KZ",
    url: SITE_URL,
    title: "Kömek — специалисты для тоя, праздника и дома",
    description: "Тамада, ведущие, артисты, фотографы — для праздника. Няни, домработницы, повара и водители — для дома. Видео-визитки, отзывы, прямой контакт.",
  },
  robots: { index: true, follow: true },
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
            {/* Популярные запросы — SEO-перелинковка (для гостей/заказчиков и поисковых роботов) */}
            <VisitorOnly>
              <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 16, fontSize: "0.84rem" }}>
                <Link href="/c/tamada" className="link" style={{ color: "var(--text-mute)" }}>{t("Тамада в Алматы")}</Link>
                <Link href="/c/photographer" className="link" style={{ color: "var(--text-mute)" }}>{t("Фотограф на той")}</Link>
                <Link href="/c/singer" className="link" style={{ color: "var(--text-mute)" }}>{t("Певец на свадьбу")}</Link>
                <Link href="/c/animator" className="link" style={{ color: "var(--text-mute)" }}>{t("Аниматор на детский праздник")}</Link>
                <Link href="/c/nanny" className="link" style={{ color: "var(--text-mute)" }}>{t("Няня на мероприятие")}</Link>
                <Link href="/c/pyro" className="link" style={{ color: "var(--text-mute)" }}>{t("Салют и фейерверк")}</Link>
                <Link href="/calc" className="link" style={{ color: "var(--text-mute)" }}>{t("Собрать той по шагам")}</Link>
                <Link href="/how" className="link" style={{ color: "var(--text-mute)" }}>{t("Как это работает")}</Link>
              </div>
            </VisitorOnly>
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
