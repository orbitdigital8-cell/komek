import { NextResponse } from "next/server";
import { aiComplete, aiEnabled, extractJson } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Перевод анкеты на казахский (заполняет tagline_kk / about_kk)
export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "ai disabled" }, { status: 503 });
  const { tagline, about } = await req.json();

  const text = await aiComplete(
    `Переведи тексты анкеты специалиста на естественный казахский язык (не дословно, а как носитель написал бы сам). Сохрани смысл и тёплый тон.

Слоган: «${tagline ?? ""}»
О себе: «${about ?? ""}»

Ответ строго JSON: {"tagline_kk": "...", "about_kk": "..."}`,
    800,
  );

  const json = extractJson<{ tagline_kk: string; about_kk: string }>(text);
  if (!json) return NextResponse.json({ error: "bad ai response" }, { status: 500 });
  return NextResponse.json(json);
}
