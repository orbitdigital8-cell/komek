import { NextResponse } from "next/server";
import { aiComplete, aiEnabled, extractJson } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Помощник анкеты: из черновика делает продающее описание + теги
export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "ai disabled" }, { status: 503 });
  const { profession, name, city, tagline, about } = await req.json();

  const text = await aiComplete(
    `Ты помогаешь специалисту маркетплейса Kömek (Казахстан, тои/праздники и домашние услуги) заполнить анкету.
Профессия: ${profession}. Имя: ${name}. Город: ${city}.
Черновик слогана: «${tagline ?? ""}»
Черновик «о себе»: «${about ?? ""}»

Составь на русском:
1) tagline — цепкий слоган до 60 символов (без кавычек, без имени);
2) about — продающее «о себе», 3-5 коротких предложений, живым языком, без штампов «команда профессионалов», уместно для Казахстана (той, узату и т.п. если подходит профессии);
3) tags — 4-6 коротких тегов-фильтров (нижний регистр).

Ответ строго JSON: {"tagline": "...", "about": "...", "tags": ["...", "..."]}`,
    700,
  );

  const json = extractJson<{ tagline: string; about: string; tags: string[] }>(text);
  if (!json) return NextResponse.json({ error: "bad ai response" }, { status: 500 });
  return NextResponse.json(json);
}
