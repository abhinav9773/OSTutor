import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import Login from "./components/Login.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import {
  askQuestion,
  askQuestionStream,
  generateMCQs,
  generateVivaQuestions,
  listChats,
  createChat,
  getChatMessages,
  addMessage,
  deleteChat,
  uploadDocument,
} from "./api.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [chatPendingDelete, setChatPendingDelete] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Only this email (set via VITE_ADMIN_EMAIL) sees the upload button.
  // This is a UX convenience only - the real enforcement happens on the
  // backend (require_admin), so even a non-admin calling the API
  // directly would still get a 403.
  const isAdmin =
    user?.email &&
    import.meta.env.VITE_ADMIN_EMAIL &&
    user.email.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setChatsLoading(true);
      loadChatsFromServer();
    }
    setAuthChecked(true);
  }, []);

  const loadChatsFromServer = async () => {
    try {
      const serverChats = await listChats();
      setChats(serverChats.map((c) => ({ ...c, messages: null })));

      const savedActiveId = localStorage.getItem("active_chat_id");
      if (savedActiveId && serverChats.some((c) => c.id === savedActiveId)) {
        await handleSelectChat(savedActiveId, serverChats);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setChatsLoading(false);
    }
  };

  const handleLoginSuccess = async ({ token, user: loggedInUser }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setChatsLoading(true);
    await loadChatsFromServer();
  };

  const performLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("active_chat_id");
    setUser(null);
    setChats([]);
    setActiveChatId(null);
    setShowLogoutConfirm(false);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages = activeChat?.messages || [];

  const updateChatMessages = (chatId, updater) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: updater(c.messages || []) } : c,
      ),
    );
  };

  const ensureActiveChat = async (firstMessageText) => {
    if (activeChatId) return activeChatId;
    const title =
      firstMessageText.length > 40
        ? firstMessageText.slice(0, 40) + "..."
        : firstMessageText;
    const created = await createChat(title);
    setChats((prev) => [{ ...created, messages: [] }, ...prev]);
    setActiveChatId(created.id);
    localStorage.setItem("active_chat_id", created.id);
    return created.id;
  };

  const performDeleteChat = async () => {
    const chatId = chatPendingDelete;
    setChatPendingDelete(null);
    if (!chatId) return;

    try {
      await deleteChat(chatId);
    } catch (err) {
      console.error("Failed to delete chat:", err);
      return;
    }

    setChats((prev) => prev.filter((c) => c.id !== chatId));

    if (activeChatId === chatId) {
      setActiveChatId(null);
      localStorage.removeItem("active_chat_id");
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    localStorage.removeItem("active_chat_id");
  };

  const handleSelectChat = async (chatId, chatsOverride) => {
    setActiveChatId(chatId);
    localStorage.setItem("active_chat_id", chatId);

    const source = chatsOverride || chats;
    const chat = source.find((c) => c.id === chatId);

    if (!chat || chat.messages == null) {
      try {
        const msgs = await getChatMessages(chatId);
        setChats((prev) => {
          const exists = prev.some((c) => c.id === chatId);
          if (exists) {
            return prev.map((c) =>
              c.id === chatId ? { ...c, messages: msgs } : c,
            );
          }
          return [{ ...chat, messages: msgs }, ...prev];
        });
      } catch (err) {
        console.error("Failed to load chat messages:", err);
      }
    }
  };

  const handleSend = async (text) => {
    const chatId = await ensureActiveChat(text);

    const priorMessages = (
      chats.find((c) => c.id === chatId)?.messages || []
    ).map((m) => ({ role: m.role, text: m.text }));

    updateChatMessages(chatId, (msgs) => [...msgs, { role: "user", text }]);
    addMessage(chatId, "user", text).catch((err) =>
      console.error("Failed to persist user message:", err),
    );

    updateChatMessages(chatId, (msgs) => [
      ...msgs,
      { role: "assistant", text: "" },
    ]);

    setLoading(true);
    try {
      const fullAnswer = await askQuestionStream(
        text,
        priorMessages,
        (chunk) => {
          updateChatMessages(chatId, (msgs) => {
            const updated = [...msgs];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              text: updated[lastIndex].text + chunk,
            };
            return updated;
          });
        },
      );

      addMessage(chatId, "assistant", fullAnswer).catch((err) =>
        console.error("Failed to persist assistant message:", err),
      );
    } catch (err) {
      const fallback =
        "Something went wrong reaching the backend. Is it running on localhost:8000?";
      updateChatMessages(chatId, (msgs) => {
        const updated = [...msgs];
        updated[updated.length - 1] = { role: "assistant", text: fallback };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMCQs = async () => {
    const topic = activeChat?.title || "Operating Systems";
    const promptText = `Generate MCQs on ${topic}`;
    const chatId = await ensureActiveChat(promptText);

    updateChatMessages(chatId, (msgs) => [
      ...msgs,
      { role: "user", text: promptText },
    ]);
    addMessage(chatId, "user", promptText).catch((err) =>
      console.error("Failed to persist user message:", err),
    );

    setLoading(true);
    try {
      const { questions } = await generateMCQs(topic);
      updateChatMessages(chatId, (msgs) => [
        ...msgs,
        { role: "assistant", text: questions },
      ]);
      addMessage(chatId, "assistant", questions).catch(() => {});
    } catch (err) {
      updateChatMessages(chatId, (msgs) => [
        ...msgs,
        { role: "assistant", text: "Couldn't generate MCQs right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateViva = async () => {
    const topic = activeChat?.title || "Operating Systems";
    const promptText = `Generate viva questions on ${topic}`;
    const chatId = await ensureActiveChat(promptText);

    updateChatMessages(chatId, (msgs) => [
      ...msgs,
      { role: "user", text: promptText },
    ]);
    addMessage(chatId, "user", promptText).catch((err) =>
      console.error("Failed to persist user message:", err),
    );

    setLoading(true);
    try {
      const { questions } = await generateVivaQuestions(topic);
      updateChatMessages(chatId, (msgs) => [
        ...msgs,
        { role: "assistant", text: questions },
      ]);
      addMessage(chatId, "assistant", questions).catch(() => {});
    } catch (err) {
      updateChatMessages(chatId, (msgs) => [
        ...msgs,
        {
          role: "assistant",
          text: "Couldn't generate viva questions right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadStatus(`Uploading ${file.name}...`);
      try {
        const result = await uploadDocument(file);
        if (result.error) {
          setUploadStatus(`Failed: ${result.error}`);
        } else {
          setUploadStatus(
            `Added ${file.name} (${result.chunks_created} chunks)`,
          );
        }
      } catch (err) {
        setUploadStatus("Upload failed. Try again.");
      }
      setTimeout(() => setUploadStatus(null), 5000);
    };
    input.click();
  };

  if (!authChecked) return null;

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-bg text-textPrimary font-body">
      <div className="pointer-events-none absolute -top-28 -right-20 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(232,147,95,0.35),rgba(217,122,77,0.12)_45%,transparent_70%)] blur-[10px]" />
      <div className="pointer-events-none absolute top-10 right-14 w-[90px] h-[90px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f5c396,#e8935f_55%,#b3653a_100%)] shadow-[0_0_60px_10px_rgba(232,147,95,0.25)]" />

      <div className="relative z-10 flex w-full h-full min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          chats={chats}
          chatsLoading={chatsLoading}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onOpenLinuxHelper={() => handleSend("Help me with a Linux command")}
          onGenerateMCQs={handleGenerateMCQs}
          onGenerateViva={handleGenerateViva}
          onDeleteChatClick={setChatPendingDelete}
          onUploadClick={isAdmin ? handleUploadClick : undefined}
          uploadStatus={isAdmin ? uploadStatus : null}
          user={user}
          onLogoutClick={() => setShowLogoutConfirm(true)}
        />
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          loading={loading}
          greetingName={user?.name?.split(" ")[0] || "there"}
        />
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign out?"
        message="You'll need to sign in again with Google to access your chats."
        confirmLabel="Sign out"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <ConfirmDialog
        open={!!chatPendingDelete}
        title="Delete this chat?"
        message="This will permanently delete the chat and all its messages. This can't be undone."
        confirmLabel="Delete"
        onConfirm={performDeleteChat}
        onCancel={() => setChatPendingDelete(null)}
      />
    </div>
  );
}
