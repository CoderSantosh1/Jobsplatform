import Home from "./pages/Home";
import ChatWidget from "@/components/ChatWidget";

export default function About() {
  return (
    <>
      <Home />
      <h1 className="text-2xl font-bold mb-4">AI Chatbot (Local Ollama)</h1>
      <ChatWidget />
    </>
  );
}
