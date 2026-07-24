import "server-only";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";

const VAPID_PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIV = process.env.VAPID_PRIVATE_KEY;
if (VAPID_PUB && VAPID_PRIV) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:info@komek.kz", VAPID_PUB, VAPID_PRIV);
}

type Payload = { title: string; body: string; url: string; type?: string };

async function sendTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  }).catch(() => {});
}

// Рассылает уведомление списку пользователей: всегда в личный кабинет (in-app),
// плюс во включённые внешние каналы (браузер, Telegram).
export async function notifyUsers(userIds: string[], p: Payload) {
  if (!userIds.length) return;
  const sb = supabaseAdmin();

  // 1) In-app: пишем в «Уведомления» кабинета каждому — работает всегда
  await sb.from("notifications").insert(
    userIds.map((uid) => ({ user_id: uid, type: p.type ?? "info", title: p.title, body: p.body, url: p.url })),
  );

  // 2) Внешние каналы — только тем, кто их включил
  const { data } = await sb.from("notification_prefs").select("*").in("user_id", userIds);
  for (const pref of (data as {
    user_id: string; web_push: webpush.PushSubscription | null; web_enabled: boolean;
    telegram_chat_id: string | null; tg_enabled: boolean;
  }[]) ?? []) {
    if (pref.web_enabled && pref.web_push) {
      try {
        await webpush.sendNotification(pref.web_push, JSON.stringify(p));
      } catch (e) {
        // Подписка мертва (410/404) — гасим канал, чтобы не долбить впустую
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await sb.from("notification_prefs").update({ web_enabled: false, web_push: null }).eq("user_id", pref.user_id);
        }
      }
    }
    if (pref.tg_enabled && pref.telegram_chat_id) {
      await sendTelegram(pref.telegram_chat_id, `🔔 ${p.title}\n${p.body}\n${p.url}`);
    }
  }
}

// Владельцы анкет заданных профессий (для рассылки по бирже)
export async function ownersByProfessions(professions: string[]): Promise<string[]> {
  if (!professions.length) return [];
  const sb = supabaseAdmin();
  const { data } = await sb.from("specialists").select("owner_id").in("profession", professions).not("owner_id", "is", null);
  return Array.from(new Set(((data as { owner_id: string }[]) ?? []).map((r) => r.owner_id)));
}
