import "server-only";

// ИИ-функции платформы для пользователей — на бесплатном Google Gemini.
// (Разработку ведём отдельно через Claude Code; в самой платформе Anthropic не используется.)

export function aiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

// Единый вызов ИИ: принимает промпт, возвращает текст ответа.
export async function aiComplete(prompt: string, maxTokens = 800): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return "";
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    },
  );
  const d = await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// Достаём JSON из ответа модели (на случай пояснений вокруг)
export function extractJson<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}
