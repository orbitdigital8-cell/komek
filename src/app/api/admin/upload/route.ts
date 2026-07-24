import { NextResponse } from "next/server";
import { supabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Отладка: загрузка файла (фото/видео) в бакет media через service_role.
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const specialistId = (form.get("specialistId") as string) || "misc";
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const ext = file.name.split(".").pop() || "bin";
  const path = `admin/${specialistId}/${crypto.randomUUID()}.${ext}`;
  const sb = supabaseAdmin();
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from("media").upload(path, buf, { contentType: file.type || undefined, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}
