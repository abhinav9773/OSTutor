const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function askQuestion(question, history = []) {
  const res = await fetch(`${BASE_URL}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });
  if (!res.ok) throw new Error("Failed to get an answer");
  return res.json(); // { answer, sources }
}

/**
 * Streaming version - calls onChunk(text) as each piece arrives from the
 * backend. Now also sends recent conversation history so the model has
 * memory within this chat (can resolve "that", "it", "the second one",
 * etc. from earlier turns). Resolves with the full accumulated text once
 * the stream ends, so callers can persist the complete message.
 */
export async function askQuestionStream(question, history, onChunk) {
  const res = await fetch(`${BASE_URL}/chat/ask/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });
  if (!res.ok || !res.body) throw new Error("Failed to get an answer");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });
    fullText += chunkText;
    onChunk(chunkText);
  }

  return fullText;
}

export async function generateMCQs(topic, numQuestions = 5) {
  const res = await fetch(`${BASE_URL}/chat/mcqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num_questions: numQuestions }),
  });
  if (!res.ok) throw new Error("Failed to generate MCQs");
  return res.json();
}

export async function generateVivaQuestions(topic, numQuestions = 5) {
  const res = await fetch(`${BASE_URL}/chat/viva`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num_questions: numQuestions }),
  });
  if (!res.ok) throw new Error("Failed to generate viva questions");
  return res.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/ingest/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
}

export async function listChats() {
  const res = await fetch(`${BASE_URL}/chats`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to load chats");
  return res.json();
}

export async function createChat(title = "New chat") {
  const res = await fetch(`${BASE_URL}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create chat");
  return res.json();
}

export async function getChatMessages(chatId) {
  const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

export async function addMessage(chatId, role, text) {
  const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role, text }),
  });
  if (!res.ok) throw new Error("Failed to save message");
  return res.json();
}

export async function deleteChat(chatId) {
  const res = await fetch(`${BASE_URL}/chats/${chatId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to delete chat");
  return res.json();
}
