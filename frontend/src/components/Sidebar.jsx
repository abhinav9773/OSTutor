import {
  Plus,
  Terminal,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  LogOut,
  Trash2,
  Upload,
} from "lucide-react";
import Logo from "./Logo.jsx";

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  chats,
  chatsLoading,
  activeChatId,
  onSelectChat,
  onNewChat,
  onOpenLinuxHelper,
  onGenerateMCQs,
  onGenerateViva,
  onDeleteChatClick,
  onUploadClick,
  uploadStatus,
  user,
  onLogoutClick,
}) {
  return (
    <div
      className={`border-r border-panelBorder flex flex-col shrink-0 overflow-hidden
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-[64px] p-3" : "w-[260px] p-5"}`}
    >
      {collapsed ? (
        <div className="flex flex-col items-center h-full transition-opacity duration-200 ease-in-out">
          <div className="mb-6 shrink-0">
            <Logo size={22} />
          </div>
          <button
            onClick={onToggleCollapse}
            className="text-textFaint hover:text-textPrimary transition-colors mb-6"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
          <button
            onClick={onNewChat}
            className="text-accent hover:text-accentSoft transition-colors mb-auto"
            title="New chat"
          >
            <Plus size={18} />
          </button>
          {user && (
            <button title={user.name || user.email} className="mt-4 shrink-0">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="w-8 h-8 rounded-full border border-panelBorder"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-bg text-xs font-semibold">
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full transition-opacity duration-200 ease-in-out">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Logo size={22} />
              <span className="font-display text-lg tracking-wide text-textPrimary whitespace-nowrap">
                OSTutor
              </span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="text-textFaint hover:text-textPrimary transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="flex items-center gap-2 bg-panel border border-panelBorder text-textPrimary rounded-[10px] px-3 py-2.5 text-[13px] mb-5 hover:border-accent/40 transition-colors whitespace-nowrap"
          >
            <Plus size={14} className="text-accent" />
            New chat
          </button>

          <div className="text-[11px] uppercase tracking-wider text-textFaint mb-2.5 whitespace-nowrap">
            Chats
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0">
            {chatsLoading ? (
              <div className="flex flex-col gap-1.5 px-2.5 py-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[30px] rounded-lg bg-[#171310] animate-pulse"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="text-[12px] text-textFaint italic px-2.5 py-2">
                No chats yet
              </div>
            ) : null}
            {!chatsLoading &&
              chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className={`group flex items-center gap-2 text-[12.5px] px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    c.id === activeChatId
                      ? "bg-[#1d1814] text-textPrimary"
                      : "text-textFaint hover:text-textMuted"
                  }`}
                >
                  <MessageSquare size={13} className="shrink-0 opacity-70" />
                  <span className="truncate flex-1 min-w-0">{c.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChatClick(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-textFaint hover:text-red-400 transition-opacity shrink-0 p-0.5"
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
          </div>

          {/* Upload button only renders when the parent passes a handler -
              App.jsx only does that for the admin account, so non-admins
              simply never see this in the DOM at all. */}
          {onUploadClick && (
            <>
              <button
                onClick={onUploadClick}
                className="flex items-center gap-2 text-[12.5px] text-textMuted px-2.5 py-2 rounded-lg hover:bg-panel transition-colors text-left whitespace-nowrap mt-2"
              >
                <Upload size={14} /> Upload document
              </button>
              {uploadStatus && (
                <div className="text-[11px] text-textFaint italic px-2.5 pb-1">
                  {uploadStatus}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-1.5 pt-4 mt-2 border-t border-panelBorder">
            <button
              onClick={onOpenLinuxHelper}
              className="flex items-center gap-2 text-[12.5px] text-textMuted px-2.5 py-2 rounded-lg hover:bg-panel transition-colors text-left whitespace-nowrap"
            >
              <Terminal size={14} /> Linux command helper
            </button>
            <button
              onClick={onGenerateMCQs}
              className="flex items-center gap-2 text-[12.5px] text-textMuted px-2.5 py-2 rounded-lg hover:bg-panel transition-colors text-left whitespace-nowrap"
            >
              <HelpCircle size={14} /> Generate MCQs
            </button>
            <button
              onClick={onGenerateViva}
              className="flex items-center gap-2 text-[12.5px] text-textMuted px-2.5 py-2 rounded-lg hover:bg-panel transition-colors text-left whitespace-nowrap"
            >
              <HelpCircle size={14} /> Generate viva questions
            </button>
          </div>

          {user && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-panelBorder">
              <div className="flex items-center gap-2 min-w-0">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    className="w-6 h-6 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-bg text-[10px] font-semibold shrink-0">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-[12px] text-textMuted truncate">
                  {user.name || user.email}
                </span>
              </div>
              <button
                onClick={onLogoutClick}
                className="text-textFaint hover:text-textPrimary transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
