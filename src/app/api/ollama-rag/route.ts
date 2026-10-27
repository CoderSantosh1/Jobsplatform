// src/app/api/ollama-rag/route.ts
import { NextResponse } from "next/server";

type Body = { message: string };

export async function POST(req: Request) {
  // Local-development helper that proxies to services on this machine; off unless explicitly enabled.
  if (process.env.ENABLE_OLLAMA !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const { message } = (await req.json()) as Body;
    if (!message)
      return NextResponse.json({ error: "No message" }, { status: 400 });

    // 1) call local search service
    const searchRes = await fetch("http://127.0.0.1:8001/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: message, k: 4 }),
    });

    if (!searchRes.ok) {
      const txt = await searchRes.text();
      console.error("Search error:", txt);
      return NextResponse.json(
        { error: "Search failed", details: txt },
        { status: 500 }
      );
    }

    const searchJson = await searchRes.json();
    const docs = searchJson.results ?? [];

    // Build the context string
    const contextParts = docs
      .map((d: any, i: number) => {
        return `Doc ${i + 1} (id:${d.id}):\n${d.text}\n---\n`;
      })
      .join("\n");

    const systemPrompt = `
You are an assistant for a jobs/news/admissions website. Use ONLY the provided documents to answer the user's question. If the answer isn't in the documents, say you don't know and offer to search or ask for clarification.

Context documents:
${contextParts}
    `.trim();

    const payload = {
      model: "mistral",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      stream: false,
    };

    // 2) call Ollama local chat endpoint
    const ollamaRes = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!ollamaRes.ok) {
      const txt = await ollamaRes.text();
      console.error("Ollama error:", txt);
      return NextResponse.json(
        { error: "Ollama failed", details: txt },
        { status: 500 }
      );
    }

    // Ollama returns streaming-like JSON lines (we saw that). We'll just return the whole text.
    const text = await ollamaRes.text();

    // If Ollama sends newline-separated JSON chunks, we can attempt to parse and concat content pieces.
    try {
      const lines = text.split("\n").filter(Boolean);
      const messages: string[] = [];
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          // 'message' (chat) or 'response' (gen) may contain the content
          if (obj.message?.content) messages.push(obj.message.content);
          else if (obj.response) messages.push(obj.response);
        } catch (e) {
          // ignore parse errors
        }
      }
      const combined = messages.join("");
      return NextResponse.json({ ok: true, answer: combined, raw: text });
    } catch (e) {
      return NextResponse.json({ ok: true, answer: text });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
