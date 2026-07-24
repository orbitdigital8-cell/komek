import { NextResponse } from "next/server";
import { aiComplete, aiEnabled, extractJson } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Мягкая модерация текста анкеты: контакты в открытом тексте, оскорбления, спам
export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ ok: true, skipped: true });
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ ok: true });

  const out = await aiComplete(
    `Проверь текст анкеты маркетплейса услуг. Нарушения: телефоны/ссылки/мессенджеры прямо в тексте (контакты должны быть только в спецполях), оскорбления, явный спам или обман.

Текст: «${String(text).slice(0, 2000)}»

Ответ строго JSON: {"ok": true} либо {"ok": false, "reason": "короткое объяснение по-русски"}`,
    200,
  );

  const json = extractJson<{ ok: boolean; reason?: string }>(out);
  return NextResponse.json(json ?? { ok: true });
}
