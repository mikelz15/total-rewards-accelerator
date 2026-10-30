"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

/**
 * Ask TRA — public-site chat bubble.
 *
 * Public pages only: like the Nav, it stays off /app, /login, /signup and
 * /auth. When the monthly budget cap is hit the API reports "paused" and the
 * panel shows the contact email instead of the chat, per plan.
 */

const STARTERS = [
  "What does Cleaner do with a messy HRIS file?",
  "How does Closer turn an offer into a four-year view?",
  "What's included with Equity + Merit?",
  "How does the public demo work?",
  "How do I start a trial?",
  "How do I reach Mike?",
];

interface Msg {
  role: "user" | "assistant";
  content: string;
}

type ChatStatus = "open" | "alert" | "paused" | "unknown";

const FALLBACK_EMAIL = "heyrio@mail.grokbot.com";

export function AskTra() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ask" | "talk">("ask");
  const [status, setStatus] = useState<ChatStatus>("unknown");
  const [contactEmail, setContactEmail] = useState(FALLBACK_EMAIL);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handoff form state
  const [hName, setHName] = useState("");
  const [hEmail, setHEmail] = useState("");
  const [hQuestion, setHQuestion] = useState("");
  const [hState, setHState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const hidden =
    pathname.startsWith("/app") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth");

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    fetch("/api/ask-tra")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.status) setStatus(data.status as ChatStatus);
        if (data?.contactEmail) setContactEmail(data.contactEmail as string);
      })
      .catch(() => {
        if (!cancelled) setStatus("open");
      });
    return () => {
      cancelled = true;
    };
  }, [hidden]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open, tab]);

  if (hidden) return null;

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy || status === "paused") return;
    setNotice(null);
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ask-tra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (res.status === 429) {
        setMessages((m) => m.slice(0, -1));
        setNotice("That's a lot of questions in a row — give it a few minutes, or use Talk to Mike.");
        return;
      }
      if (res.status === 503) {
        setMessages((m) => m.slice(0, -1));
        setStatus("paused");
        return;
      }
      if (!res.ok || !res.body) {
        setMessages((m) => m.slice(0, -1));
        setNotice("Something broke on my end. Try again, or email us below.");
        setTab("talk");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc.trim()) {
        setMessages((m) => m.slice(0, -1));
        setNotice("I didn't get an answer that time. Try rephrasing, or use Talk to Mike.");
      }
    } catch {
      setMessages((m) => m.slice(0, -1));
      setNotice("Connection problem. Try again, or email us below.");
    } finally {
      setBusy(false);
    }
  }

  async function submitHandoff(e: FormEvent) {
    e.preventDefault();
    if (hState === "sending") return;
    setHState("sending");
    try {
      const res = await fetch("/api/ask-tra/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hName, email: hEmail, question: hQuestion }),
      });
      if (!res.ok) throw new Error("handoff failed");
      setHState("sent");
    } catch {
      setHState("error");
    }
  }

  const paused = status === "paused";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Ask TRA</p>
              <p className="text-xs text-slate-300">
                Answers from the site&apos;s own pages. Not a person.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Ask TRA"
              className="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex border-b border-slate-200 text-sm">
            <button
              type="button"
              onClick={() => setTab("ask")}
              className={`flex-1 px-4 py-2.5 font-medium ${
                tab === "ask" ? "bg-teal-50 text-teal-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ask a question
            </button>
            <button
              type="button"
              onClick={() => setTab("talk")}
              className={`flex-1 px-4 py-2.5 font-medium ${
                tab === "talk" ? "bg-teal-50 text-teal-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Talk to Mike
            </button>
          </div>

          {tab === "ask" && paused && (
            <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-6 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Ask TRA is paused for this month.</p>
              <p>
                The chat has hit its monthly limit, so it rests until the 1st. A person is still
                easy to reach — email Mike&apos;s team and a person will pick it up:
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="font-medium text-teal-700 hover:underline"
              >
                {contactEmail}
              </a>
              <p>Or use the Talk to Mike tab above and the message goes to the same inbox.</p>
            </div>
          )}

          {tab === "ask" && !paused && (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <div>
                    <p className="text-sm text-slate-600">
                      Ask about the tools, the demo, or the trial. One rule: never paste real
                      employee or candidate data in here — the demo runs on a sample file for that
                      reason.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STARTERS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-teal-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {m.content || (busy && i === messages.length - 1 ? "…" : "")}
                  </div>
                ))}
                {notice && <p className="text-xs text-rose-700">{notice}</p>}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex gap-2 border-t border-slate-200 px-3 py-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about TRA…"
                  maxLength={2000}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="rounded-xl bg-ember px-4 py-2 text-sm font-medium text-white hover:bg-ember-deep disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}

          {tab === "talk" && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {hState === "sent" ? (
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Sent. Thanks.</p>
                  <p className="mt-2">
                    Your message went to Mike&apos;s team.
                    Replies come back by email — it isn&apos;t instant, and nobody will auto-reply
                    in Mike&apos;s name.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitHandoff} className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Goes to Mike&apos;s team at {contactEmail}.
                    Replies come by email.
                  </p>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Your name</span>
                    <input
                      required
                      value={hName}
                      onChange={(e) => setHName(e.target.value)}
                      maxLength={120}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Your email</span>
                    <input
                      required
                      type="email"
                      value={hEmail}
                      onChange={(e) => setHEmail(e.target.value)}
                      maxLength={200}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Your question</span>
                    <textarea
                      required
                      value={hQuestion}
                      onChange={(e) => setHQuestion(e.target.value)}
                      rows={5}
                      maxLength={4000}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600"
                    />
                  </label>
                  {hState === "error" && (
                    <p className="text-xs text-rose-700">
                      That didn&apos;t go through. Email directly instead:{" "}
                      <a href={`mailto:${contactEmail}`} className="font-medium hover:underline">
                        {contactEmail}
                      </a>
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={hState === "sending"}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {hState === "sending" ? "Sending…" : "Send"}
                  </button>
                  <p className="text-xs text-slate-500">
                    Prefer email? Write to{" "}
                    <a href={`mailto:${contactEmail}`} className="font-medium text-teal-700 hover:underline">
                      {contactEmail}
                    </a>{" "}
                    directly.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Ask TRA" : "Open Ask TRA"}
        className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-ember-deep"
      >
        {open ? "Close" : "Ask TRA"}
      </button>
    </div>
  );
}
