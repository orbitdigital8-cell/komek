import "server-only";

// ИИ-функции платформы — бесплатные провайдеры с автопереключением (fallback).
// Если у одного кончился дневной лимит (429) — запрос идёт к следующему.
// Anthropic в платформе НЕ используется (это лишь инструмент разработки).

type Provider = { name: string; key?: string; call: (prompt: string, maxTokens: number, json: boolean) => Promise<string> };

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free";
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL ?? "llama-3.3-70b";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? "mistral-small-latest";
const COHERE_MODEL = process.env.COHERE_MODEL ?? "command-r-08-2024";

// OpenAI-совместимый вызов (Groq, OpenRouter, Cerebras, Pollinations и т.п.)
// json=true → response_format json_object: модель обязана вернуть валидный JSON без «рассуждений».
// key=null — без авторизации (например, бесплатный pollinations.ai без ключа).
async function openaiCompatible(url: string, key: string | null, model: string, prompt: string, maxTokens: number, json: boolean, extraHeaders: Record<string, string> = {}): Promise<string> {
  try {
    const body: Record<string, unknown> = { model, max_tokens: maxTokens, temperature: 0.4, messages: [{ role: "user", content: prompt }] };
    if (json) body.response_format = { type: "json_object" };
    const headers: Record<string, string> = { "Content-Type": "application/json", ...extraHeaders };
    if (key) headers.Authorization = `Bearer ${key}`;
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    const d = await r.json();
    if (!r.ok) { console.error(`AI ${url} error:`, JSON.stringify(d).slice(0, 200)); return ""; }
    return d?.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    console.error(`AI ${url} exception:`, String(e).slice(0, 200));
    return "";
  }
}

// Cohere v2 — свой формат ответа (message.content[0].text)
async function cohereComplete(key: string, prompt: string, maxTokens: number, json: boolean): Promise<string> {
  try {
    const body: Record<string, unknown> = { model: COHERE_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] };
    if (json) body.response_format = { type: "json_object" };
    const r = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { console.error("AI cohere error:", JSON.stringify(d).slice(0, 200)); return ""; }
    return d?.message?.content?.[0]?.text ?? "";
  } catch (e) {
    console.error("AI cohere exception:", String(e).slice(0, 200));
    return "";
  }
}

// Цепочка провайдеров по приоритету — первый с ключом и ответом побеждает.
const POLLINATIONS_MODEL = process.env.POLLINATIONS_MODEL ?? "openai";

function providers(): Provider[] {
  const list: Provider[] = [
    // Бесплатный и без лимитов, без API-ключа — основной движок платформы (жми сколько хочешь).
    // json_object у анонимного тарифа платный (402), поэтому НЕ шлём его — «рассуждения»
    // модель отдаёт в отдельном поле reasoning, а content остаётся чистым (extractJson разберёт).
    { name: "pollinations", key: "public", call: (p, m) => openaiCompatible("https://text.pollinations.ai/openai", null, POLLINATIONS_MODEL, p, m, false) },
    { name: "groq", key: process.env.GROQ_API_KEY, call: (p, m, j) => openaiCompatible("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY!, GROQ_MODEL, p, m, j) },
    { name: "mistral", key: process.env.MISTRAL_API_KEY, call: (p, m, j) => openaiCompatible("https://api.mistral.ai/v1/chat/completions", process.env.MISTRAL_API_KEY!, MISTRAL_MODEL, p, m, j) },
    { name: "cohere", key: process.env.COHERE_API_KEY, call: (p, m, j) => cohereComplete(process.env.COHERE_API_KEY!, p, m, j) },
    { name: "openrouter", key: process.env.OPENROUTER_API_KEY, call: (p, m, j) => openaiCompatible("https://openrouter.ai/api/v1/chat/completions", process.env.OPENROUTER_API_KEY!, OPENROUTER_MODEL, p, m, j, { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://komek.kz", "X-Title": "Komek" }) },
    { name: "cerebras", key: process.env.CEREBRAS_API_KEY, call: (p, m, j) => openaiCompatible("https://api.cerebras.ai/v1/chat/completions", process.env.CEREBRAS_API_KEY!, CEREBRAS_MODEL, p, m, j) },
  ];
  return list.filter((x) => !!x.key);
}

export function aiEnabled(): boolean {
  return providers().length > 0;
}

// Единый вызов ИИ: пробует провайдеров по очереди, пока не получит ответ.
// json=true — просим строго JSON (response_format), чтобы модель не писала «рассуждения».
export async function aiComplete(prompt: string, maxTokens = 800, json = false): Promise<string> {
  for (const p of providers()) {
    const out = await p.call(prompt, maxTokens, json);
    if (out.trim()) return out;
  }
  return "";
}

// Достаём JSON из ответа модели: снимаем markdown-обёртку ```json и берём {…}
export function extractJson<T>(text: string): T | null {
  let s = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const m = s.match(/\{[\s\S]*\}/);
  if (m) s = m[0];
  try { return JSON.parse(s) as T; } catch { return null; }
}
