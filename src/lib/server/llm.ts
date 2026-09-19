import Anthropic from "@anthropic-ai/sdk";

/** Provider selection shared by chat and analysis: Anthropic if configured, else Groq (OpenAI-compatible). */
export function provider(): "anthropic" | "groq" | null {
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  return null;
}
export const providerLabel = () => (provider() === "anthropic" ? "anthropic:claude-opus-5" : provider() === "groq" ? `groq:${process.env.GROQ_MODEL || "openai/gpt-oss-120b"}` : "none");

/** Ask for a JSON object and parse it robustly (strips code fences / leading prose). */
export async function completeJSON<T>(system: string, user: string, maxTokens = 8000): Promise<T> {
  const p = provider();
  if (!p) throw new Error("no_credentials");
  let text = "";
  if (p === "anthropic") {
    const client = new Anthropic();
    const s = client.messages.stream({ model: "claude-opus-5", max_tokens: maxTokens, system: [{ type: "text", text: system }], messages: [{ role: "user", content: user }], thinking: { type: "adaptive" }, output_config: { effort: "high" } });
    const final = await s.finalMessage();
    text = final.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  } else {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || "openai/gpt-oss-120b", temperature: 0.2, max_tokens: maxTokens, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const j = await res.json(); text = j.choices?.[0]?.message?.content || "";
  }
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
