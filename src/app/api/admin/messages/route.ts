import { NextResponse } from "next/server";
import { supabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Отладка: чтение/отправка сообщений треда от имени персоны (в обход RLS).
export async function GET(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id");
  if (!requestId) return NextResponse.json({ error: "no request_id" }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("messages").select("*").eq("request_id", requestId).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const { request_id, sender_id, body } = await req.json();
  if (!request_id || !sender_id || !body?.trim()) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("messages").insert({ request_id, sender_id, body: body.trim() }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
