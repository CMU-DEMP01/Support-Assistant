"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";

type Msg = {
  role: "user" | "assistant";
  text: string;
  citations?: { n: number; source: string; score: number }[];
};

export default function AssistantWidget() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "👋 Hi! I’m your support assistant. Upload docs (PDF/URLs) or start asking questions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [open, setOpen] = useState(false); // starts closed
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send() {
    const content = input.trim();
    if (!content) return;
    setMessages((m) => [...m, { role: "user", text: content }]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content }),
    });

    if (res.headers.get("content-type")?.includes("application/json") && !res.body) {
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.text }]);
      return;
    }

    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let acc = "";
    let citations: Msg["citations"] | undefined = undefined;

    setMessages((m) => [...m, { role: "assistant", text: "" }]);
    const idx = messages.length;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      let pos: number;
      while ((pos = acc.indexOf("\n")) >= 0) {
        const line = acc.slice(0, pos).trim();
        acc = acc.slice(pos + 1);
        if (!line) continue;
        const evt = JSON.parse(line);
        if (evt.type === "meta") {
          citations = evt.sources;
        } else if (evt.type === "delta") {
          setMessages((m) => {
            const clone = [...m];
            clone[idx] = {
              role: "assistant",
              text: (clone[idx]?.text || "") + evt.text,
              citations,
            };
            return clone;
          });
        }
      }
    }
  }

  async function ingestUrls() {
    const urls = ingestUrl.split(",").map((s) => s.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setIngesting(true);
    const r = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    const data = await r.json();
    setIngesting(false);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: data.ok
          ? `✅ Ingested ${data.added} chunks. Ready!`
          : `❌ Ingest error: ${data.error || "unknown"}`,
      },
    ]);
    if (data.ok) setShowUploader(false); // hide upload area
  }

  async function ingestPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIngesting(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/ingest", { method: "POST", body: fd });
    const data = await r.json();
    setIngesting(false);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: data.ok
          ? `📄 PDF ingested (${data.added} chunks).`
          : `❌ Ingest error: ${data.error || "unknown"}`,
      },
    ]);
    e.target.value = "";
    if (data.ok) setShowUploader(false); // hide upload area
  }

  // --- Floating button when closed ---
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <Bot size={28} />
      </button>
    );
  }

  // --- Chatbox when open ---
  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] flex flex-col rounded-xl shadow-xl border bg-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-blue-600 text-white">
        <h2 className="font-semibold flex items-center gap-2">
          <Bot size={18} /> Support Assistant
        </h2>
        <button onClick={() => setOpen(false)} className="hover:opacity-80">
          <X size={18} />
        </button>
      </header>

      {/* Upload Section */}
      <div
        className={`transition-all duration-500 overflow-hidden ${
          showUploader ? "max-h-32 p-3 border-b" : "max-h-0"
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            className="px-3 py-2 rounded-lg border text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Upload PDF or ingest URLs"
            value={ingestUrl}
            onChange={(e) => setIngestUrl(e.target.value)}
          />
          <button
            onClick={ingestUrls}
            disabled={ingesting}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {ingesting ? "…" : "Ingest"}
          </button>
          <label className="px-3 py-2 rounded-lg border bg-gray-100 text-sm cursor-pointer hover:bg-gray-200">
            PDF
            <input type="file" accept="application/pdf" className="hidden" onChange={ingestPdf} />
          </label>
        </div>
      </div>

      {/* Chat Section */}
      <div ref={boxRef} className="flex-1 overflow-y-auto px-3 py-4 bg-gray-50">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl shadow-sm max-w-[75%] ${
                m.role === "user"
                  ? "ml-auto bg-blue-600 text-white"
                  : "mr-auto bg-white border text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="text-xs text-gray-600 mt-2 border-t pt-2">
                  <div className="font-medium mb-1">Sources:</div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {m.citations.map((c) => (
                      <li key={c.n}>
                        [{c.n}]{" "}
                        <a href={c.source} className="underline" target="_blank" rel="noreferrer">
                          {c.source}
                        </a>
                        <span className="ml-2 opacity-70">score {c.score}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white p-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
