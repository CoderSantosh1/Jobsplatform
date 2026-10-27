// src/app/api/ollama-chat/route.ts
import { NextResponse } from "next/server";

type OllamaChunk =
  | { message?: { role?: string; content?: string }; response?: string }
  | Record<string, any>;

export async function POST(req: Request) {
  // Local-development helper that proxies to services on this machine; off unless explicitly enabled.
  if (process.env.ENABLE_OLLAMA !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const { message } = await req.json();

    // call the local Ollama server
    const res = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        messages: [{ role: "user", content: message }],
        // Ollama streams by default — we handle streaming below by parsing newline JSON
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("Ollama returned non-OK:", res.status, t);
      return NextResponse.json(
        { error: "Ollama non-OK", raw: t },
        { status: 502 }
      );
    }

    // read entire response body as text (server returns newline-delimited JSON chunks)
    const text = await res.text();

    // split by newline (some chunks may be empty)
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let answer = "";
    const parsedChunks: OllamaChunk[] = [];

    for (const line of lines) {
      try {
        const chunk = JSON.parse(line) as OllamaChunk;
        parsedChunks.push(chunk);

        // two possible shapes we saw in logs:
        // chat: { model, message: { role, content }, done }
        // gen:  { model, response, done }
        if (chunk.message && typeof chunk.message.content === "string") {
          answer += chunk.message.content;
        } else if (typeof (chunk as any).response === "string") {
          answer += (chunk as any).response;
        } else if (typeof (chunk as any).text === "string") {
          // some endpoints may return 'text'
          answer += (chunk as any).text;
        }
      } catch (err) {
        // If a line fails to parse, append raw for debugging
        console.warn("Failed to parse Ollama line:", line.slice(0, 200));
      }
    }

    // final cleanup: normalize spaces, remove leading newlines
    answer = answer.replace(/\s+$/g, "");
    answer = answer.replace(/^\s+/, "");

    return NextResponse.json({
      answer,
      raw: lines.length ? lines.slice(0, 50) : [], // include first up to 50 lines for debugging (not full huge raw)
    });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
