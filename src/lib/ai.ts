import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// ИИ-фичи включаются, когда в .env.local задан ANTHROPIC_API_KEY
export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function aiClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Быстрая модель для перевода/текстов; для подбора команды можно задать AI_MODEL_SMART
export const AI_MODEL = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";
export const AI_MODEL_SMART = process.env.AI_MODEL_SMART ?? "claude-sonnet-5";

// Достаём JSON из ответа модели (на случай пояснений вокруг)
export function extractJson<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}
