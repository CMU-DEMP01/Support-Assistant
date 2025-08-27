import { NextRequest } from "next/server";
import { getLLM } from "@/lib/gemini";
import { retrieve } from "@/lib/rag";
import { ruleAnswer, RULE_KB } from "@/lib/rules";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { message } = await req.json() as { message: string };
  const q = message?.trim();
  if (!q) {
    return new Response("No message", { status: 400 });
  }

  // 1) Rule-based short-circuit (deterministic)
  const ra = ruleAnswer(q);
  if (ra) {
    return Response.json({
      type: "rule",
      text: ra,
      citations: [],
    });
  }

  // 2) Retrieve from company data
  const passages = await retrieve(q, 6);
  const context = passages.map((p, i) => `[[${i+1}]] (${p.source}) ${p.text}`).join("\n\n");

  // 3) Build system prompt
  const system = `
You are a helpful, precise customer-support assistant.
- Answer ONLY from the provided context when relevant.
- If context is insufficient, say you don't know and offer escalation.
- Always include numbered citations like [1], [2] that map to sources below.
- If user asks for contact, hours, pricing, or help links, use this canonical info:
  - Phone: ${RULE_KB.supportNumber}
  - Email: ${RULE_KB.supportEmail}
  - Hours: ${RULE_KB.hours}
  - Help Center: ${RULE_KB.helpCenterUrl}
  - Status: ${RULE_KB.statusUrl}
  - Pricing: ${RULE_KB.pricingUrl}
Keep answers concise and actionable.`.trim();

  const user = `
User question:
${q}

Context passages:
${context || "(no context available)"}
`.trim();

  // 4) Call Gemini (stream or single-shot)
  const model = getLLM("gemini-1.5-flash");
  const stream = await model.generateContentStream({
  contents: [
    {
      role: "user",
      parts: [
        { text: "You are a helpful assistant." }, // system instruction
        { text: user } // actual user query
      ]
    }
  ]
});


  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify({
        type: "meta",
        sources: passages.map((p, i) => ({ n: i+1, source: p.source, score: Number(p.score?.toFixed(3) || 0) }))
      }) + "\n"));

      for await (const chunk of stream.stream) {
        const text = chunk?.text();
        if (text) controller.enqueue(encoder.encode(JSON.stringify({ type: "delta", text }) + "\n"));
      }
      controller.close();
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    }
  });
}
