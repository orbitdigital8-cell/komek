// Добавляет демо-заявки на бирже по каждой профессии (без db reset).
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.SUPABASE_URL_SERVER || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const R = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[R(a.length)];

const DETAILS = ["Той на 100 гостей, ресторан в центре.", "Кыз узату, нужен на два языка.", "Юбилей мамы, 60 гостей, душевно.", "Свадьба — хотим красиво и без стресса.", "Детский праздник, 5 лет, дома."];
const NAMES = ["Айгерим", "Данияр", "Мадина", "Асель", "Тимур", "Гульнара"];
const CITIES = ["Алматы", "Астана", "Шымкент", "Караганда"];

const { data: profs } = await sb.from("professions").select("id");
const profIds = (profs ?? []).map((p) => p.id);

// Какие профессии уже покрыты открытыми заявками
const { data: existing } = await sb.from("open_requests").select("professions").eq("status", "open");
const covered = new Set();
for (const r of existing ?? []) (r.professions ?? []).forEach((p) => covered.add(p));

const missing = profIds.filter((p) => !covered.has(p));
const rows = missing.map((p) => ({
  client_id: null, client_name: pick(NAMES), professions: [p], city: pick(CITIES),
  event_date: new Date(Date.now() + (7 + R(60)) * 864e5).toISOString().slice(0, 10),
  budget: (3 + R(15)) * 50000, details: pick(DETAILS), status: "open", is_demo: true,
}));
if (rows.length) await sb.from("open_requests").insert(rows);
console.log(`added ${rows.length} open requests for professions: ${missing.join(", ") || "(none missing)"}`);
