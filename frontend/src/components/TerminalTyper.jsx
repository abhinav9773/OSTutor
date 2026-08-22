import { useState, useEffect, useRef } from "react";

const LINES = [
  { prompt: "$ ", text: "whoami", delay: 0 },
  {
    prompt: "> ",
    text: "a student who wants to actually understand deadlocks",
    delay: 700,
  },
  {
    prompt: "$ ",
    text: 'ask OSTutor "explain paging vs segmentation"',
    delay: 700,
  },
  {
    prompt: "> ",
    text: "retrieving from Lecture 6, Lab Manual 3…",
    delay: 700,
  },
  { prompt: "> ", text: "done. here's the grounded answer ↴", delay: 700 },
];

/**
 * Purely decorative terminal-style typing animation for the login hero
 * panel — types out each line, pauses, then loops. Ties the visual
 * language back to the OS/Linux subject matter instead of being a
 * generic "typewriter effect" for its own sake.
 */
export default function TerminalTyper() {
  const [displayedLines, setDisplayedLines] = useState([""]);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let cancelled = false;

    function typeNextChar() {
      if (cancelled) return;
      const current = LINES[lineIndex];
      const fullText = current.prompt + current.text;

      if (charIndex <= current.text.length) {
        setDisplayedLines((prev) => {
          const copy = [...prev];
          copy[lineIndex] = current.prompt + current.text.slice(0, charIndex);
          return copy;
        });
        charIndex++;
        timeoutRef.current = setTimeout(typeNextChar, 28 + Math.random() * 30);
      } else {
        // line finished — pause, then move to next line (or restart)
        timeoutRef.current = setTimeout(() => {
          if (lineIndex < LINES.length - 1) {
            lineIndex++;
            charIndex = 0;
            setDisplayedLines((prev) => [...prev, ""]);
            typeNextChar();
          } else {
            timeoutRef.current = setTimeout(() => {
              lineIndex = 0;
              charIndex = 0;
              setDisplayedLines([""]);
              typeNextChar();
            }, 2200);
          }
        }, current.delay);
      }
    }

    typeNextChar();
    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="font-mono text-[12.5px] leading-[1.9] text-[#c9c2b4] w-full max-w-[420px]">
      {displayedLines.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap break-words">
          <span className="text-accent">{line.slice(0, 2)}</span>
          {line.slice(2)}
          {i === displayedLines.length - 1 && (
            <span className="inline-block w-[7px] h-[14px] bg-accent ml-0.5 align-middle cursor-blink" />
          )}
        </div>
      ))}
    </div>
  );
}
