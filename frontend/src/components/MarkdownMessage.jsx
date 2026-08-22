import ReactMarkdown from "react-markdown";

/*
 * Renders an assistant message as formatted markdown (bold, lists,
 * headings, inline code, etc.) instead of raw text with literal
 * asterisks, styled to match the app's dark/amber theme.
 */
export default function MarkdownMessage({ text }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-textPrimary">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="list-disc list-outside pl-5 mb-3 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside pl-5 mb-3 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="font-display text-[19px] text-textPrimary mt-4 mb-2 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-display text-[17px] text-textPrimary mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-semibold text-[15px] text-textPrimary mt-3 mb-1.5 first:mt-0">
            {children}
          </h3>
        ),
        code: ({ inline, children }) => {
          if (inline) {
            return (
              <code className="bg-[#1d1814] text-accent px-1.5 py-0.5 rounded text-[13px] font-mono">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-[#141210] border border-panelBorder rounded-lg p-3 text-[13px] font-mono overflow-x-auto my-2">
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent/50 pl-3 italic text-textMuted my-2">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline hover:text-accentSoft"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
