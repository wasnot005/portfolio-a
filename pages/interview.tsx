import { useState, useRef, FormEvent } from "react";
import { v4 as uuid } from "uuid";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export default function Interview() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: uuid(), role: "assistant", content: "👋 Hi! Ready for your mock interview?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Msg = { id: uuid(), role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });

    // Expect plain JSON, not a stream
    const data = await res.json();
    const assistantMsg: Msg = { id: uuid(), role: "assistant", content: data.content };
    setMessages((m) => [...m, assistantMsg]);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="prose mx-auto p-6">
      <h1>AI Mock Interview</h1>
      <div className="border p-4 h-96 overflow-y-auto bg-gray-900 text-gray-100 rounded">
        {messages.map((m) => (
          <p key={m.id} className={m.role === "user" ? "text-right" : ""}>
            <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.content}
          </p>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 mt-4">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
        />
        <button className="btn-primary" type="submit">
          Send
        </button>
      </form>
    </main>
  );
}
