import { FileText, ChevronRight } from "lucide-react";

export default function SourcesPanel({ sources, onGenerateMCQs, onGenerateViva }) {
  return (
    <div className="w-[240px] border-l border-panelBorder p-6 shrink-0">
      <div className="text-[11px] uppercase tracking-wider text-textFaint mb-3.5">
        Retrieved from
      </div>
      <div className="flex flex-col gap-2">
        {sources.length === 0 && (
          <div className="text-[12px] text-textFaint italic">
            Sources will appear here once you ask a question.
          </div>
        )}
        {sources.map((s, i) => (
          <div
            key={i}
            className="bg-panel border border-panelBorder rounded-[10px] p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <FileText size={12} className="text-accent" />
              <span className="text-[12.5px] text-textPrimary">{s.source}</span>
            </div>
            {s.page && (
              <div className="text-[11px] text-textFaint">p. {s.page}</div>
            )}
          </div>
        ))}
      </div>

      <div className="text-[11px] uppercase tracking-wider text-textFaint mt-6 mb-3.5">
        Quick actions
      </div>
      <button
        onClick={onGenerateViva}
        className="w-full flex items-center justify-between text-[12.5px] text-[#d8d2c6] bg-panel border border-panelBorder rounded-[10px] px-3 py-2.5 mb-1.5 hover:border-accent/40 transition-colors"
      >
        Generate viva questions <ChevronRight size={13} className="text-textFaint" />
      </button>
      <button
        onClick={onGenerateMCQs}
        className="w-full flex items-center justify-between text-[12.5px] text-[#d8d2c6] bg-panel border border-panelBorder rounded-[10px] px-3 py-2.5 hover:border-accent/40 transition-colors"
      >
        Generate MCQs <ChevronRight size={13} className="text-textFaint" />
      </button>
    </div>
  );
}
