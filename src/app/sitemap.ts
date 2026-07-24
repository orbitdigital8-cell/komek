import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://komek.pages.dev";

// Карта сайта для поисковиков: статические страницы + все профессии и анкеты специалистов
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/calc`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/dom`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/match`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/orders`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/how`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const sb = await supabaseServer();
    const [{ data: profs }, { data: specs }] = await Promise.all([
      sb.from("professions").select("id").order("sort_order"),
      sb.from("specialists").select("id, created_at").eq("published", true).order("rating", { ascending: false }).limit(2000),
    ]);

    const profPages: MetadataRoute.Sitemap = ((profs as { id: string }[]) ?? []).map((p) => ({
      url: `${SITE_URL}/c/${p.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    const specPages: MetadataRoute.Sitemap = ((specs as { id: string; created_at?: string }[]) ?? []).map((s) => ({
      url: `${SITE_URL}/s/${s.id}`,
      lastModified: s.created_at ? new Date(s.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...profPages, ...specPages];
  } catch {
    return staticPages;
  }
}
