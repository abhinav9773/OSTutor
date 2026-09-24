import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage.jsx";

function InputBar({ input, setInput, handleSend, autoFocus }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2.5 bg-panel border border-panelBorder rounded-[22px] pl-[18px] pr-1.5 py-2">
      <Sparkles size={15} className="text-accent shrink-0 mb-2" />
      <textarea
        ref={textareaRef}
        autoFocus={autoFocus}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about OS..."
        className="flex-1 bg-transparent border-none outline-none resize-none text-textPrimary text-[14px] placeholder:text-textFaint py-1.5 leading-relaxed no-scrollbar"
        style={{ maxHeight: "160px" }}
      />
      <button
        onClick={handleSend}
        className="w-[34px] h-[34px] rounded-full bg-accent flex items-center justify-center hover:bg-accentSoft transition-colors shrink-0 mb-0.5"
      >
        <Send size={14} className="text-bg" />
      </button>
    </div>
  );
}

// Shimmer placeholder shown while a previously-selected chat's messages are
// being fetched. Mimics the real bubble layout (alternating left/right,
// same radius/border/bg as the actual bubbles) so the swap-in doesn't jump.
function ChatSkeleton() {
  const widths = ["w-1/2", "w-2/3", "w-2/5", "w-1/3"];
  return (
    <div className="flex-1 flex justify-center h-full min-h-0 px-4 sm:px-8">
      <div className="flex flex-col h-full min-h-0 w-full max-w-[800px] py-7">
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1 no-scrollbar">
          {widths.map((w, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`h-[46px] ${w} rounded-[14px] bg-[#171310] border border-panelBorder animate-pulse`}
                style={{ animationDelay: `${i * 110}ms` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-5 h-[52px] rounded-[22px] bg-panel border border-panelBorder animate-pulse" />
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  onSend,
  loading,
  greetingName,
  messagesLoading,
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  // While a selected chat's messages are still being fetched, show the
  // shimmer skeleton instead of letting the empty-state ("new chat") UI
  // flash before the real messages arrive.
  if (messagesLoading) {
    return <ChatSkeleton />;
  }

  const isEmpty = messages.length === 0;

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-0 px-4 sm:px-8">
        <div className="w-full max-w-[640px] flex flex-col items-center text-center">
          <div className="font-display text-[24px] sm:text-[30px] text-textPrimary mb-1.5">
            Good evening, {greetingName}.
          </div>
          <div className="text-textFaint text-sm italic mb-8">
            What's on your mind today?
          </div>
          <div className="w-full">
            <InputBar
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  const lastIndex = messages.length - 1;

  return (
    <div className="flex-1 flex justify-center h-full min-h-0 px-4 sm:px-8">
      <div className="flex flex-col h-full min-h-0 w-full max-w-[800px] py-5 sm:py-7">
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1 no-scrollbar"
        >
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div
                  key={i}
                  className="self-end max-w-[85%] sm:max-w-[70%] bg-[#171310] border border-panelBorder rounded-[14px_14px_4px_14px] px-4 py-3 text-[15px] leading-relaxed text-[#e8e2d6] whitespace-pre-wrap"
                >
                  {m.text}
                </div>
              );
            }

            // The last assistant message may still be an empty placeholder
            // while we're waiting for the first streamed chunk to arrive -
            // show "Thinking..." for that brief moment instead of nothing.
            const isStreamingPlaceholder =
              i === lastIndex && loading && m.text === "";

            return (
              <div key={i} className="flex gap-2.5 max-w-full sm:max-w-[90%]">
                <div
                  className={`w-[14px] h-[14px] rounded-full bg-accent shrink-0 mt-1 ${
                    isStreamingPlaceholder ? "animate-pulse" : ""
                  }`}
                />
                {isStreamingPlaceholder ? (
                  <div className="text-[15px] text-textFaint italic">
                    Thinking...
                  </div>
                ) : (
                  <div className="text-[15px] text-[#d8d2c6] min-w-0">
                    <MarkdownMessage text={m.text} />
                    {i === lastIndex && loading && (
                      <span className="inline-block w-[7px] h-[15px] bg-accent/70 ml-0.5 align-text-bottom animate-pulse" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <InputBar input={input} setInput={setInput} handleSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
