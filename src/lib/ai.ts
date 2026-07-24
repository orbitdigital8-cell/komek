import "server-only";

// ИИ-функции платформы для пользователей — на бесплатном провайдере.
// Приоритет: Groq (бесплатно, работает в КЗ) → Gemini (если доступен в регионе).
// Разработку ведём через Claude Code отдельно; Anthropic в платформе не используется.

function provider(): "groq" | "gemini" | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

export function aiEnabled(): boolean {
  return provider() !== null;
}

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

// Единый вызов ИИ: принимает промпт, возвращает текст ответа.
export async function aiComplete(prompt: string, maxTokens = 800): Promise<string> {
  const p = provider();

  if (p === "groq") {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    if (!r.ok) { console.error("Groq error:", JSON.stringify(d).slice(0, 300)); return ""; }
    return d?.choices?.[0]?.message?.content ?? "";
  }

  if (p === "gemini") {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
      },
    );
    const d = await r.json();
    if (!r.ok) { console.error("Gemini error:", JSON.stringify(d).slice(0, 300)); return ""; }
    return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
