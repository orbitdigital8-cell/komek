import "server-only";

// ИИ-функции платформы — бесплатные провайдеры с автопереключением (fallback).
// Если у одного кончился дневной лимит (429) — запрос идёт к следующему.
// Anthropic в платформе НЕ используется (это лишь инструмент разработки).

type Provider = { name: string; key?: string; call: (prompt: string, maxTokens: number) => Promise<string> };

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free";
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL ?? "llama-3.3-70b";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? "mistral-small-latest";
const COHERE_MODEL = process.env.COHERE_MODEL ?? "command-r-08-2024";

// OpenAI-совместимый вызов (Groq, OpenRouter, Cerebras и т.п.)
async function openaiCompatible(url: string, key: string, model: string, prompt: string, maxTokens: number, extraHeaders: Record<string, string> = {}): Promise<string> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...extraHeaders },
      body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.7, messages: [{ role: "user", content: prompt }] }),
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
async function cohereComplete(key: string, prompt: string, maxTokens: number): Promise<string> {
  try {
    const r = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: COHERE_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
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
function providers(): Provider[] {
  return [
    { name: "groq", key: process.env.GROQ_API_KEY, call: (p: string, m: number) => openaiCompatible("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY!, GROQ_MODEL, p, m) },
    { name: "openrouter", key: process.env.OPENROUTER_API_KEY, call: (p: string, m: number) => openaiCompatible("https://openrouter.ai/api/v1/chat/completions", process.env.OPENROUTER_API_KEY!, OPENROUTER_MODEL, p, m, { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://komek.kz", "X-Title": "Komek" }) },
    { name: "mistral", key: process.env.MISTRAL_API_KEY, call: (p: string, m: number) => openaiCompatible("https://api.mistral.ai/v1/chat/completions", process.env.MISTRAL_API_KEY!, MISTRAL_MODEL, p, m) },
    { name: "cohere", key: process.env.COHERE_API_KEY, call: (p: string, m: number) => cohereComplete(process.env.COHERE_API_KEY!, p, m) },
    { name: "cerebras", key: process.env.CEREBRAS_API_KEY, call: (p: string, m: number) => openaiCompatible("https://api.cerebras.ai/v1/chat/completions", process.env.CEREBRAS_API_KEY!, CEREBRAS_MODEL, p, m) },
  ].filter((x) => !!x.key);
}

export function aiEnabled(): boolean {
  return providers().length > 0;
}

// Единый вызов ИИ: пробует провайдеров по очереди, пока не получит ответ.
export async function aiComplete(prompt: string, maxTokens = 800): Promise<string> {
  for (const p of providers()) {
    const out = await p.call(prompt, maxTokens);
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
