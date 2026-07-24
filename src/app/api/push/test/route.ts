import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP = process.env.NEXT_PUBLIC_APP_URL || "";

// Тестовое уведомление самому себе — «Проверить уведомления» в кабинете
export async function POST() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  await notifyUsers([user.id], { title: "Kömek", body: "Уведомления подключены ✓", url: `${APP}/dashboard` });
  return NextResponse.json({ ok: true });
}
