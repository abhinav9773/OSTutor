export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[320px] bg-panel border border-panelBorder rounded-2xl p-6 shadow-2xl animate-[fadeInScale_0.18s_ease-out]"
      >
        <div className="font-display text-lg text-textPrimary mb-2">
          {title}
        </div>
        <div className="text-[13px] text-textMuted mb-6 leading-relaxed">
          {message}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-[12.5px] text-textMuted hover:text-textPrimary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full text-[12.5px] bg-accent text-bg font-medium hover:bg-accentSoft transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
