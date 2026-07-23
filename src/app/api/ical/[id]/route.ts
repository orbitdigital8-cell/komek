import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ICS-фид занятости специалиста: подписка в Google Calendar / Apple Calendar.
// Даты занятости публичны (их видно на анкете), поэтому фид анонимный.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createClient(
    process.env.SUPABASE_URL_SERVER || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [{ data: sp }, { data: busy }] = await Promise.all([
    sb.from("specialists").select("name").eq("id", id).maybeSingle(),
    sb.from("specialist_busy").select("busy_date, note").eq("specialist_id", id).order("busy_date"),
  ]);
  if (!sp) return new NextResponse("not found", { status: 404 });

  const events = ((busy as { busy_date: string; note: string }[]) ?? [])
    .map((b) => {
      const d = b.busy_date.replace(/-/g, "");
      // Событие «весь день»: DTEND — следующий день (по стандарту ICS)
      const next = new Date(b.busy_date + "T00:00:00Z");
      next.setUTCDate(next.getUTCDate() + 1);
      const dEnd = next.toISOString().slice(0, 10).replace(/-/g, "");
      const title = b.note ? `Kömek: ${b.note}` : "Kömek: занято";
      return [
        "BEGIN:VEVENT",
        `UID:${id}-${d}@komek`,
        `DTSTART;VALUE=DATE:${d}`,
        `DTEND;VALUE=DATE:${dEnd}`,
        `SUMMARY:${title.replace(/[\n,;]/g, " ")}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Komek//Busy//RU",
    `X-WR-CALNAME:Kömek — ${String((sp as { name: string }).name).replace(/[\n,;]/g, " ")}`,
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=komek-busy.ics",
    },
  });
}
