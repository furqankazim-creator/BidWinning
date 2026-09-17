import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const personas: Record<string, string> = {
  "tender-manager": "You orchestrate the bid: you know every module, route work to the right specialist, and summarise status and next steps.",
  clarifications: "You own the clarification log across rounds: spot ambiguities, conflicts and gaps in the tender documents and phrase precise questions to the client in their format.",
  contract: "You are the contract & commercial lead: clause-by-clause positions, deviations, liability, LDs, payment terms, bonds.",
  risk: "You are the risk & opportunity lead: probability × impact scoring, mitigations, contingency and lessons from past bids.",
  cost: "You are the cost & pricing lead: cost base, margin, price versions, price-to-win.",
  deliverables: "You are the deliverables lead: ITT-required documents, templates, submission checklist and readiness.",
  engineering: "You are the engineering lead: technical scope, methodology, standards and precedent from past projects.",
};

export async function POST(req: NextRequest) {
  const { agent, messages, context } = (await req.json()) as { agent: string; messages: { role: "user" | "assistant"; text: string }[]; context: unknown };
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const hasGroq = !!process.env.GROQ_API_KEY;
  if (!hasAnthropic && !hasGroq) {
    return new Response(JSON.stringify({ error: "no_credentials" }), { status: 503, headers: { "content-type": "application/json" } });
  }
  const system = [
    { type: "text" as const, text: `You are a specialist agent inside VendorIQ, an AI-powered multi-industry tender, bid and procurement intelligence platform. ${personas[agent] || personas["tender-manager"]}

Rules you must follow:
- Base every statement on the workspace context provided. Cite the source (document, clause, requirement id, register item) when you make a claim about the tender.
- Never present assumptions as facts. If information is missing from the context, say so and suggest which document or person to check.
- Never fabricate competitor data. If you have no verified information, say "Insufficient verified information."
- Anything you draft (clarifications, clause positions, risks, proposal text) is a DRAFT for human review; say so and suggest which register it belongs in.
- Be concise and structured: short paragraphs or bullet lists, no filler. Use the tender's currency. Do not include internal or system XML tags in your response.` },
    { type: "text" as const, text: `Workspace context (JSON):\n${JSON.stringify(context)}`, cache_control: { type: "ephemeral" as const } },
  ];
  const history: Anthropic.MessageParam[] = messages.filter((m) => m.text.trim()).map((m) => ({ role: m.role, content: m.text }));
  if (!history.length || history[0].role !== "user") return new Response(JSON.stringify({ error: "first message must be from the user" }), { status: 400 });

  const encoder = new TextEncoder();

  // Fallback provider: Groq (OpenAI-compatible chat completions, SSE). Used only when no Anthropic credential is configured.
  if (!hasAnthropic) {
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model, stream: true, max_tokens: 2048, temperature: 0.3, messages: [{ role: "system", content: system.map((b) => b.text).join("\n\n") }, ...history.map((m) => ({ role: m.role, content: String(m.content) }))] }),
    });
    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      return new Response(`[Groq error ${upstream.status}: ${detail.slice(0, 200)}]`, { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "x-provider": "groq" } });
    }
    const body = upstream.body;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = body.getReader(); const dec = new TextDecoder(); let buf = ""; let sent = 0;
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n"); buf = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim(); if (data === "[DONE]") continue;
              try { const j = JSON.parse(data); const delta = j.choices?.[0]?.delta?.content; if (delta) { controller.enqueue(encoder.encode(delta)); sent++; } } catch { /* partial frame */ }
            }
          }
          if (!sent) controller.enqueue(encoder.encode("[No content returned by the model.]"));
        } catch (e) { controller.enqueue(encoder.encode(`\n\n[Stream error: ${e instanceof Error ? e.message : "unknown"}]`)); }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-provider": `groq:${model}` } });
  }

  const client = new Anthropic();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const s = client.messages.stream({ model: "claude-opus-5", max_tokens: 4096, system, messages: history, thinking: { type: "adaptive" }, output_config: { effort: "medium" } });
        s.on("text", (t) => controller.enqueue(encoder.encode(t)));
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\n[The model declined this request.]"));
        controller.close();
      } catch (e) {
        const msg = e instanceof Anthropic.AuthenticationError ? "Invalid ANTHROPIC_API_KEY." : e instanceof Anthropic.RateLimitError ? "Rate limited — try again shortly." : e instanceof Anthropic.APIError ? `API error ${e.status}: ${e.message}` : "Connection error.";
        controller.enqueue(encoder.encode(`\n\n[${msg}]`));
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-provider": "anthropic:claude-opus-5" } });
}
