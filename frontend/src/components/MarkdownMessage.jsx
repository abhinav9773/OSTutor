import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/*
 * Renders an assistant message as formatted markdown (bold, lists,
 * headings, inline code, tables, etc.) instead of raw text with literal
 * markdown symbols, styled to match the app's dark/amber theme.
 *
 * remarkGfm enables GitHub-Flavored Markdown extensions - critically,
 * pipe tables ("| Step | Page |..."). Without it, ReactMarkdown only
 * understands CommonMark, which has no table syntax at all, so a table
 * the model writes just shows up as literal pipe characters in a
 * paragraph instead of an actual table.
 */
export default function MarkdownMessage({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-lg border border-panelBorder no-scrollbar">
            <table className="w-full text-[13px] border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#1d1814]">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-panelBorder last:border-b-0">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="text-left font-semibold text-textPrimary px-3 py-2 whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-[#d8d2c6] whitespace-nowrap">
            {children}
          </td>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
