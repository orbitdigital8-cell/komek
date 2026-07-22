import type { Metadata } from "next";
import Link from "next/link";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ShortlistProvider } from "@/lib/shortlist";
import { PersonaProvider } from "@/lib/persona";
import Header from "@/components/Header";
import ShortlistBar from "@/components/ShortlistBar";
import DebugBar from "@/components/DebugBar";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Kömek — специалисты для мероприятий и дома",
  description:
    "Kömek — каталог тамада, ведущих, аниматоров, диджеев, фотографов, а также нянь, домработниц и водителей. Найдите нужного специалиста для тоя, праздника или дома.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        <AuthProvider>
          <ShortlistProvider>
          <PersonaProvider>
            <Header />
            <DebugBar />
            <main>{children}</main>
            <ShortlistBar />
          <footer style={{ borderTop: "1px solid var(--border)", marginTop: 64, padding: "28px 0" }}>
            <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, color: "var(--text-mute)", fontSize: "0.88rem" }}>
              <span>© 2026 Kömek — маркетплейс специалистов для мероприятий и дома</span>
              <span style={{ display: "flex", gap: 14 }}>
                Казахстан · демо-версия
                {process.env.ADMIN_DEBUG === "1" && <Link href="/admin" className="link">⚙ Админ</Link>}
              </span>
            </div>
          </footer>
          </PersonaProvider>
          </ShortlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
