import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { ASK_TRA } from "@/lib/ask-tra/config";
import { RateLimiter } from "@/lib/ask-tra/ratelimit";
import {
  SENSITIVE_REFUSAL,
  detectSensitiveData,
  estimateCostUsd,
  visitorKey,
} from "@/lib/ask-tra/guardrails";
import { budgetStatus, getStore, monthKey } from "@/lib/ask-tra/store";
import { sendOpsAlert } from "@/lib/ask-tra/mailer";
import { systemPrompt } from "@/lib/ask-tra/prompt";

/**
 * Ask TRA — public chat endpoint.
 *
 * Order of operations is deliberate: rate limit → budget cap → sensitive-data
 * pre-flight → model. A refused or paused request never reaches the model,
 * and chat content is never logged or stored — only aggregate counters in
 * the usage store move.
 */

const chatLimiter = new RateLimiter(ASK_TRA.chatPerWindow, ASK_TRA.chatWindowMs, ASK_TRA.chatPerDay);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages: ChatMessage[] = [];
  let total = 0;
  for (const item of raw.slice(-ASK_TRA.maxMessages)) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const text = content.trim().slice(0, ASK_TRA.maxMessageChars);
    if (!text) return null;
    total += text.length;
    messages.push({ role, content: text });
  }
  if (total > ASK_TRA.maxTotalChars) return null;
  if (messages[messages.length - 1].role !== "user") return null;
  return messages;
}

/** UI status probe: tells the bubble whether chat is open or paused. */
export async function GET() {
  const store = getStore();
  const usage = await store.getUsage(monthKey());
  return NextResponse.json({
    status: budgetStatus(usage),
    contactEmail: ASK_TRA.contactEmail,
  });
}

export async function POST(request: NextRequest) {
  const store = getStore();
  const month = monthKey();
  const key = visitorKey(clientIp(request));

  if (!chatLimiter.take(key)) {
    return NextResponse.json(
      { error: "rate_limited", contactEmail: ASK_TRA.contactEmail },
      { status: 429 }
    );
  }
  chatLimiter.sweep();

  const usage = await store.getUsage(month);
  if (budgetStatus(usage) === "paused") {
    return NextResponse.json(
      { error: "paused", contactEmail: ASK_TRA.contactEmail },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json({ error: "invalid_messages" }, { status: 400 });
  }

  // Guardrail layer 1: deterministic pre-flight on everything the visitor
  // sent. Hits are refused before the model sees a word of it.
  for (const message of messages) {
    if (message.role !== "user") continue;
    const hit = detectSensitiveData(message.content);
    if (hit) {
      await store.record(month, { refusals: 1 });
      return new Response(SENSITIVE_REFUSAL, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Ask-Tra-Refused": hit.kind },
      });
    }
  }

  const result = streamText({
    model: ASK_TRA.model,
    system: systemPrompt(),
    messages,
    maxOutputTokens: ASK_TRA.maxOutputTokens,
    temperature: 0.2,
    abortSignal: request.signal,
    async onFinish({ totalUsage, usage: stepUsage }) {
      const usage = totalUsage ?? stepUsage;
      const cost = estimateCostUsd(ASK_TRA.model, usage);
      const recorded = await store.record(month, {
        questions: 1,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        estCostUsd: cost,
      });
      if (recorded.crossedAlert) {
        await sendOpsAlert(
          "budget alert ($20)",
          `Ask TRA estimated monthly spend is $${recorded.usage.estCostUsd.toFixed(2)} ` +
            `(${recorded.usage.questions} questions this month). Chat pauses automatically at $${ASK_TRA.budgetCapUsd}.`
        );
      }
      if (recorded.crossedCap) {
        await sendOpsAlert(
          "budget cap reached ($25) — chat paused",
          `Ask TRA hit the monthly cap at $${recorded.usage.estCostUsd.toFixed(2)} estimated. ` +
            `The chat UI now shows the contact email instead. Counters reset on the 1st (UTC).`
        );
      }
    },
  });

  return result.toTextStreamResponse();
}
