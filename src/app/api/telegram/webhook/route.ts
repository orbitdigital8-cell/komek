import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Вебхук Telegram: ловит «/start <code>» и привязывает chat_id к специалисту.
// В проде: задать вебхук — https://api.telegram.org/bot<token>/setWebhook?url=<APP>/api/telegram/webhook
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: true });
  const update = await req.json().catch(() => ({}));
  const msg = update.message;
  const text: string = msg?.text ?? "";
  const chatId = msg?.chat?.id;
  if (!chatId) return NextResponse.json({ ok: true });

  const reply = async (t: string) => {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: t }),
    }).catch(() => {});
  };

  const m = text.match(/^\/start\s+(\S+)/);
  if (m) {
    const code = m[1];
    const sb = supabaseAdmin();
    const { data: link } = await sb.from("telegram_links").select("user_id").eq("code", code).maybeSingle();
    if (link) {
      await sb.from("notification_prefs").upsert(
        { user_id: link.user_id, telegram_chat_id: String(chatId), tg_enabled: true, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      await sb.from("telegram_links").delete().eq("code", code);
      await reply("✅ Уведомления Kömek подключены! Будем присылать сюда новые заявки.");
    } else {
      await reply("Код не найден или устарел. Откройте «Уведомления» в кабинете Kömek и нажмите «Подключить Telegram» ещё раз.");
    }
  } else {
    await reply("Привет! Это бот уведомлений Kömek. Чтобы подключить, откройте кабинет специалиста → «Уведомления» → «Подключить Telegram».");
  }
  return NextResponse.json({ ok: true });
}
