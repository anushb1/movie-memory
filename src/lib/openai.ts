import "server-only"; // build fails if a client component ever imports this file
import OpenAI from "openai";

// The API key is read from process.env on the SERVER only. It has no
// NEXT_PUBLIC_ prefix, so Next.js never bundles it into browser code.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Optional: point at an OpenAI-compatible provider (Gemini, Groq, Ollama).
  // Empty -> real OpenAI.
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 10_000, // don't let a slow API hang the dashboard forever
  maxRetries: 1,
});

export const FACT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
