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

// Бытовые профессии — не для праздничной команды (в командном подборе исключаем,
// если клиент не назвал их явно). Это услуги для дома, а не для программы тоя.
const HOUSEHOLD = ["nanny", "housekeeper", "cook", "driver"];

function detectProfessions(query: string): string[] {
  const q = query.toLowerCase();
  const found: string[] = [];
  for (const [prof, kws] of Object.entries(PROF_KEYWORDS)) {
    if (kws.some((k) => q.includes(k))) found.push(prof);
  }
  return found;
}

// Города Казахстана — по корню слова (учитываем падежи: «в Алматы», «Шымкенте»)
const CITY_ROOTS: Record<string, string[]> = {
  "Алматы": ["алмат"], "Астана": ["астан", "нур-султ", "нурсултан"], "Шымкент": ["шымкент"],
  "Караганда": ["караганд"], "Актобе": ["актоб"], "Тараз": ["тараз"], "Павлодар": ["павлодар"],
  "Усть-Каменогорск": ["усть-камен", "өскемен", "оскемен"], "Семей": ["семей"], "Атырау": ["атырау"],
  "Костанай": ["костанай", "қостанай"], "Кызылорда": ["кызылорд", "қызылорд"], "Уральск": ["уральск", "орал"],
  "Петропавловск": ["петропавл"], "Актау": ["актау", "ақтау"], "Темиртау": ["темиртау"],
  "Туркестан": ["туркестан", "түркістан"], "Кокшетау": ["кокшетау", "көкшетау"],
};
function detectCity(query: string): string | null {
  const q = query.toLowerCase();
  for (const [city, roots] of Object.entries(CITY_ROOTS)) {
    if (roots.some((r) => q.includes(r))) return city;
  }
  return null;
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
  const city = detectCity(query); // на один той нужны специалисты из одного города

  // Бытовые исключаем только в командном подборе и если клиент их не называл явно
  const excludeHousehold = teamMode && !wanted.some((w) => HOUSEHOLD.includes(w));

  async function fetchCatalog(withCity: boolean) {
    let cat = sb
      .from("specialists")
      .select("id, profession, name, city, price_from, rating, review_count")
      .eq("published", true);
    if (restrict) cat = cat.in("profession", wanted);
    if (excludeHousehold) cat = cat.not("profession", "in", `(${HOUSEHOLD.join(",")})`);
    if (withCity && city) cat = cat.eq("city", city);
    const { data } = await cat.order("rating", { ascending: false }).limit(restrict ? 25 : 80);
    return (data as { id: string; profession: string; name: string; city: string; price_from: number | null; rating: number; review_count: number }[]) ?? [];
  }

  // Сначала строго по городу; если там пусто/мало — берём без города (лучше показать, чем ничего)
  let data = city ? await fetchCatalog(true) : await fetchCatalog(false);
  if (city && data.length < 2) data = await fetchCatalog(false);

  // Компактно (меньше токенов): id|профессия|город|цена|рейтинг
  const compact = data.map((s) => `${s.id}|${s.profession}|${s.city}|${s.price_from ?? "?"}|★${s.rating}`);

  const text = await aiComplete(
    `Ты — подбор команды на маркетплейсе Kömek (Казахстан: тои, праздники, домашние услуги).
Запрос клиента: «${String(query).slice(0, 500)}»

Каталог (id|профессия|город|цена от ₸|рейтинг), по одному в строке:
${compact.join("\n")}

ГЛАВНОЕ ПРАВИЛО — уважай запрос клиента:
- Если клиент назвал КОНКРЕТНУЮ услугу или профессию (например «аниматор», «фотограф», «нужен тамада») — подбери ТОЛЬКО её, но дай ПОБОЛЬШЕ вариантов на выбор (5-8 подходящих специалистов). НЕ добавляй других профессий, которых не просили.
- Собирай команду из РАЗНЫХ профессий ТОЛЬКО если клиент явно просит команду / «собрать той» / «весь праздник» / перечисляет несколько услуг. Для команды можно давать по 1-2 варианта на каждую профессию.
${city ? `ГОРОД: мероприятие в городе ${city}. Все специалисты команды ДОЛЖНЫ быть из одного города ${city} — на один той нельзя собрать людей из разных городов.` : ""}
СТРОГО ПО БЮДЖЕТУ: если бюджет назван, сумма цен «от» выбранных НЕ должна превышать бюджет. Если денег не хватает — включи только самых важных в рамках бюджета и честно напиши в intro, что осталось за рамками. Лучше уложиться в бюджет, чем превысить.
Не выдумывай id. Верни ТОЛЬКО JSON без markdown и пояснений: {"intro": "1-2 предложения по-русски", "picks": [{"id": "...", "reason": "короткое почему"}]}`,
    1200,
  );

  const json = extractJson<{ intro: string; picks: { id: string; reason: string }[] }>(text);
  if (!json) return NextResponse.json({ error: "bad ai response" }, { status: 500 });

  // Каталог, из которого реально можно выбирать (уже отфильтрован по городу, если задан)
  const byId = new Map(data.map((s) => [s.id, s]));
  const cityOk = city ? data.some((s) => s.city === city) : false; // есть ли вообще спецы в этом городе

  // Защита: только реальные id; при restrict — только нужная профессия; при городе — только этот город
  json.picks = (json.picks ?? []).filter((p) => {
    const s = byId.get(p.id);
    if (!s) return false;
    if (restrict && !wanted.includes(s.profession)) return false;
    if (city && cityOk && s.city !== city) return false;
    return true;
  });

  // Для конкретной профессии показываем побольше кандидатов: дополняем топом каталога до 8
  if (restrict) {
    const have = new Set(json.picks.map((p) => p.id));
    for (const s of data) {
      if (json.picks.length >= 8) break;
      if (city && cityOk && s.city !== city) continue;
      if (!have.has(s.id)) { json.picks.push({ id: s.id, reason: "" }); have.add(s.id); }
    }
    if (!json.intro) json.intro = "Вот подходящие специалисты по вашему запросу — выбирайте.";
  }

  return NextResponse.json(json);
}
