import { NextResponse } from "next/server";
import { aiComplete, aiEnabled, extractJson } from "@/lib/ai";
import { supabaseAdmin, adminEnabled } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ИИ-подбор команды: «кыз узату на 80 гостей в Шымкенте, бюджет 500к» → готовый состав
export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "ai disabled" }, { status: 503 });
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "empty query" }, { status: 400 });

  // Каталог читаем сервисной ролью (если включена) или анонимно — данные публичные
  const sb = adminEnabled()
    ? supabaseAdmin()
    : createClient(process.env.SUPABASE_URL_SERVER || process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const { data } = await sb
    .from("specialists")
    .select("id, profession, name, city, price_from, rating, review_count, tags, tagline")
    .eq("published", true)
    .order("rating", { ascending: false })
    .limit(120);

  const compact = ((data as {
    id: string; profession: string; name: string; city: string;
    price_from: number | null; rating: number; review_count: number; tags: string[]; tagline: string;
  }[]) ?? []).map((s) => `${s.id}|${s.profession}|${s.name}|${s.city}|${s.price_from ?? "?"}₸|★${s.rating}(${s.review_count})|${s.tagline}`);

  const text = await aiComplete(
    `Ты — подбор команды на маркетплейсе Kömek (Казахстан: тои, праздники, домашние услуги).
Запрос клиента: «${String(query).slice(0, 500)}»

Каталог (id|профессия|имя|город|цена от|рейтинг|слоган), по одному в строке:
${compact.join("\n")}

Подбери подходящих специалистов (профессии — под задачу; город клиента важен). Не выдумывай id.
СТРОГО ПО БЮДЖЕТУ: если бюджет назван, сумма цен «от» выбранных НЕ должна превышать бюджет. Если на всех нужных денег не хватает — включи только самых важных для этого события в рамках бюджета (ведущий/тамада и фото важнее декора и салюта) и в intro честно напиши, что осталось за рамками бюджета и на что стоит добавить. Лучше 2 специалиста в бюджете, чем 5 с превышением.
Верни ТОЛЬКО JSON без markdown и без пояснений: {"intro": "1-2 тёплых предложения по-русски: как уложились в бюджет и что осталось за рамками, если не всё вошло", "picks": [{"id": "...", "reason": "короткое почему"}]}`,
    1200,
  );

  const json = extractJson<{ intro: string; picks: { id: string; reason: string }[] }>(text);
  if (!json) return NextResponse.json({ error: "bad ai response" }, { status: 500 });
  return NextResponse.json(json);
}
