// Перезаписывает демо-примеры работ по профессиям в текущей БД (без db reset).
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { CASE_BY_PROF } from "./cases-data.mjs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.SUPABASE_URL_SERVER || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Обновляем title/description существующих демо-кейсов под профессию (фото/видео не трогаем)
const { data: cases } = await sb.from("portfolio_cases").select("id, specialist_id");
const { data: specs } = await sb.from("specialists").select("id, profession").is("owner_id", null);
const profById = Object.fromEntries((specs ?? []).map((s) => [s.id, s.profession]));

let n = 0;
for (const c of cases ?? []) {
  const prof = profById[c.specialist_id];
  const data = CASE_BY_PROF[prof];
  if (!data) continue;
  await sb.from("portfolio_cases").update({ title: pick(data.titles), description: pick(data.descs) }).eq("id", c.id);
  n++;
}
console.log(`reseed cases: updated ${n} cases to match profession`);
