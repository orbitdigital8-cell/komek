import { NextResponse } from "next/server";
import { aiComplete, aiEnabled, extractJson } from "@/lib/ai";
import { supabaseAdmin, adminEnabled } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Ключевые слова профессий — чтобы понять, что именно просит клиент,
// и не дать ИИ навязать других специалистов.
const PROF_KEYWORDS: Record<string, string[]> = {
  animator: ["аниматор"],
  photographer: ["фотограф", "фотосъ", "фотосес"],
  videographer: ["видеограф", "видеооператор", "видеосъ", " видео"],
  tamada: ["тамада", "асаба"],
  host: ["ведущий", "ведущ"],
  singer: ["певец", "певиц", "вокалист", "вокал", "әнші"],
  dancer: ["танцор", "танцовщ", "шоу-балет", "биши"],
  dance_group: ["танцгруппа", "танцевальн", "коллектив", "ансамбль"],
  musician: ["музыкант", "домбра", "живая музыка", "кавер"],
  showman: ["шоу-программ", "фаер", "лазер", "шоумен"],
  pyro: ["салют", "фейерверк", "пиротехн", "фонтан"],
  sound: ["звукореж", "звук и свет", "аппаратур"],
  photobooth: ["фотозон", "фотобуд", "360"],
  decorator: ["декоратор", "оформлен", "декор", "флорист", "фотозона"],
  visagiste: ["визажист", "стилист", "макияж", "причёск", "причёс", "образ"],
  cake: ["кондитер", "торт", "капкейк", "кэнди"],
  nanny: ["няня", "нянь", "бала күт"],
  housekeeper: ["домработ", "уборк"],
  cook: ["повар", "аспаз", "бешбармак", "казан", "плов"],
  driver: ["водитель", "трансфер", "минивэн", "развоз"],
  organizer: ["организатор", "под ключ"],
};

// «Собери команду / весь той» — сигнал, что нужно несколько профессий
const TEAM_SIGNALS = ["команд", "весь той", "полный", "под ключ", "всё для", "все для", "собрать той", "организ"];

function detectProfessions(query: string): string[] {
  const q = query.toLowerCase();
  const found: string[] = [];
  for (const [prof, kws] of Object.entries(PROF_KEYWORDS)) {
    if (kws.some((k) => q.includes(k))) found.push(prof);
  }
  return found;
}

// ИИ-подбор команды: «кыз узату на 80 гостей в Шымкенте, бюджет 500к» → готовый состав
export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "ai disabled" }, { status: 503 });
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "empty query" }, { status: 400 });

  // Каталог читаем сервисной ролью (если включена) или анонимно — данные публичные
  const sb = adminEnabled()
    ? supabaseAdmin()
    : createClient(process.env.SUPABASE_URL_SERVER || process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Если клиент назвал конкретные профессии — подаём ИИ ТОЛЬКО их (он не сможет добавить чужих)
  const wanted = detectProfessions(query);
  const teamMode = TEAM_SIGNALS.some((s) => query.toLowerCase().includes(s));
  const restrict = wanted.length > 0 && !teamMode;

  let cat = sb
    .from("specialists")
    .select("id, profession, name, city, price_from, rating, review_count")
    .eq("published", true);
  if (restrict) cat = cat.in("profession", wanted);
  const { data } = await cat.order("rating", { ascending: false }).limit(restrict ? 25 : 60);

  // Компактно (меньше токенов): id|профессия|город|цена|рейтинг
  const compact = ((data as {
    id: string; profession: string; name: string; city: string;
    price_from: number | null; rating: number; review_count: number;
  }[]) ?? []).map((s) => `${s.id}|${s.profession}|${s.city}|${s.price_from ?? "?"}|★${s.rating}`);

  const text = await aiComplete(
    `Ты — подбор команды на маркетплейсе Kömek (Казахстан: тои, праздники, домашние услуги).
Запрос клиента: «${String(query).slice(0, 500)}»

Каталог (id|профессия|город|цена от ₸|рейтинг), по одному в строке:
${compact.join("\n")}

ГЛАВНОЕ ПРАВИЛО — уважай запрос клиента:
- Если клиент назвал КОНКРЕТНУЮ услугу или профессию (например «аниматор», «фотограф», «нужен тамада») — подбери ТОЛЬКО её, 1-3 варианта на выбор. НЕ добавляй других специалистов, которых не просили.
- Собирай команду из РАЗНЫХ профессий ТОЛЬКО если клиент явно просит команду / «собрать той» / «весь праздник» / перечисляет несколько услуг.
СТРОГО ПО БЮДЖЕТУ: если бюджет назван, сумма цен «от» выбранных НЕ должна превышать бюджет. Если денег не хватает — включи только самых важных в рамках бюджета и честно напиши в intro, что осталось за рамками. Лучше уложиться в бюджет, чем превысить.
Не выдумывай id. Верни ТОЛЬКО JSON без markdown и пояснений: {"intro": "1-2 предложения по-русски", "picks": [{"id": "...", "reason": "короткое почему"}]}`,
    1200,
  );

  const json = extractJson<{ intro: string; picks: { id: string; reason: string }[] }>(text);
  if (!json) return NextResponse.json({ error: "bad ai response" }, { status: 500 });

  // Защита: оставляем только реальные id из каталога (ИИ мог выдумать или взять чужую профессию)
  const catalog = new Map(((data as { id: string; profession: string }[]) ?? []).map((s) => [s.id, s.profession]));
  json.picks = (json.picks ?? []).filter((p) => {
    if (!catalog.has(p.id)) return false;
    if (restrict && !wanted.includes(catalog.get(p.id)!)) return false;
    return true;
  });

  // Если после фильтра пусто, но профессия ясна — отдаём топ этой профессии из каталога
  if (json.picks.length === 0 && restrict) {
    json.picks = ((data as { id: string }[]) ?? []).slice(0, 3).map((s) => ({ id: s.id, reason: "" }));
    if (!json.intro) json.intro = "Вот подходящие специалисты по вашему запросу.";
  }

  return NextResponse.json(json);
}
