import { useEffect, useRef } from "react";
import { Sparkles, FileText, MessageSquare, Cpu } from "lucide-react";
import TerminalTyper from "./TerminalTyper.jsx";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
import Logo from "./Logo.jsx";

// Module-level flag (not component state) - survives re-renders and
// React StrictMode's double-invoke in dev, so initialize() truly only
// ever runs once per page load. This is what fixes the "called multiple
// times" warning from Google's own library.
let googleInitialized = false;

export default function Login({ onLoginSuccess }) {
  const buttonRef = useRef(null);
  const navButtonRef = useRef(null);

  useEffect(() => {
    if (!window.google || (!buttonRef.current && !navButtonRef.current)) return;

    if (!googleInitialized) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await fetch(`${BASE_URL}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential }),
            });
            if (!res.ok) throw new Error("Login failed");
            const data = await res.json();
            onLoginSuccess(data);
          } catch (err) {
            console.error("Google login failed:", err);
          }
        },
      });
      googleInitialized = true;
    }

    // Main sign-in button, inside the card lower down.
    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        width: 220,
      });
    }

    // Compact shortcut in the top-right corner, for anyone who doesn't
    // want to scroll down to the full card. Same click flow, same
    // initialized client - just a second rendered button.
    if (navButtonRef.current) {
      window.google.accounts.id.renderButton(navButtonRef.current, {
        theme: "filled_black",
        size: "medium",
        shape: "pill",
        width: 130,
        text: "signin",
      });
    }
  }, [onLoginSuccess]);

  return (
    // flex-col below lg: hero stacks on top of the login card instead of
    // being hidden. overflow-x-hidden (not overflow-hidden) so the
    // decorative blobs stay clipped horizontally but stacked content that
    // runs long on very short phones can still scroll vertically.
    <div className="relative flex flex-col min-h-screen bg-bg text-textPrimary font-body overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] animate-grid-drift"
        style={{
          backgroundImage:
            "linear-gradient(#e8935f 1px, transparent 1px), linear-gradient(90deg, #e8935f 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -top-20 -right-16 w-[280px] h-[280px] sm:-top-32 sm:-right-24 sm:w-[500px] sm:h-[500px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(232,147,95,0.28),rgba(217,122,77,0.09)_45%,transparent_70%)] blur-[10px] animate-float-slow" />
      <div className="pointer-events-none absolute top-14 right-8 w-[70px] h-[70px] sm:top-24 sm:right-32 sm:w-[110px] sm:h-[110px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f5c396,#e8935f_55%,#b3653a_100%)] shadow-[0_0_80px_16px_rgba(232,147,95,0.22)] animate-pulse-glow" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[220px] h-[220px] sm:w-[380px] sm:h-[380px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(232,147,95,0.14),transparent_70%)] blur-[10px] animate-float-slower" />

      {/* Top nav: brand on the left, a compact sign-in shortcut on the
          right - so returning users don't have to scroll to the card. */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24 pt-6">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-display text-xl tracking-wide">OSTutor</span>
        </div>
        <div ref={navButtonRef} />
      </header>

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Hero / narrative panel - condensed and centered on mobile,
            full left column on lg+. */}
        <div className="flex flex-col justify-center flex-1 relative z-10 px-6 pt-10 pb-8 sm:px-10 lg:px-16 xl:px-24 lg:pt-0 lg:pb-0">
          <div className="animate-fade-in-up flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="font-display text-[26px] sm:text-[32px] lg:text-[44px] xl:text-[52px] leading-[1.2] lg:leading-[1.1] text-textPrimary mb-4 lg:mb-5 max-w-[420px] lg:max-w-[560px]">
              Your Operating Systems tutor, grounded in{" "}
              <span className="text-accent">your own</span> course material.
            </div>
            <div className="text-textFaint text-[14px] lg:text-[15px] leading-relaxed max-w-[380px] lg:max-w-[440px] mb-8 lg:mb-12">
              No fine-tuning, no hallucinated definitions - every answer is
              retrieved straight from your lecture notes, lab manuals, and past
              papers.
            </div>

            <div className="bg-panel/60 border border-panelBorder rounded-2xl p-5 backdrop-blur-sm w-full max-w-[440px] h-[170px] sm:h-[190px] lg:h-[210px] flex flex-col text-left">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-panelBorder shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4a4238]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#4a4238]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#4a4238]" />
                <span className="text-[11px] text-textFaint ml-2 font-mono">
                  OS-tutor - zsh
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <TerminalTyper />
              </div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="flex items-center justify-center w-full lg:w-[480px] relative z-10 px-4 pb-14 sm:px-6 lg:pb-0">
          <div className="relative w-full max-w-[360px] animate-fade-in-up">
            <div className="pointer-events-none absolute -inset-4 bg-[radial-gradient(circle_at_50%_20%,rgba(232,147,95,0.12),transparent_70%)] blur-md" />

            <div className="relative bg-panel border border-panelBorder rounded-[22px] px-6 sm:px-8 py-8 sm:py-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

              <div className="w-11 h-11 rounded-2xl bg-[#1d1814] border border-panelBorder flex items-center justify-center mb-4">
                <Logo size={20} />
              </div>

              <div className="font-display text-[23px] leading-tight text-textPrimary mb-1.5">
                Welcome back.
              </div>
              <div className="text-textFaint text-[13px] leading-relaxed mb-7">
                Sign in to pick up right where you left off.
              </div>

              <div className="flex flex-col gap-3.5 mb-7 pb-7 border-b border-panelBorder">
                <div className="flex items-center gap-3 text-[12.5px] text-textMuted">
                  <span className="w-6 h-6 rounded-full bg-[#1d1814] flex items-center justify-center shrink-0">
                    <MessageSquare size={12} className="text-accent" />
                  </span>
                  Ask anything, sourced from your syllabus
                </div>
                <div className="flex items-center gap-3 text-[12.5px] text-textMuted">
                  <span className="w-6 h-6 rounded-full bg-[#1d1814] flex items-center justify-center shrink-0">
                    <FileText size={12} className="text-accent" />
                  </span>
                  Generate MCQs and viva questions instantly
                </div>
                <div className="flex items-center gap-3 text-[12.5px] text-textMuted">
                  <span className="w-6 h-6 rounded-full bg-[#1d1814] flex items-center justify-center shrink-0">
                    <Cpu size={12} className="text-accent" />
                  </span>
                  Linux command help, built right in
                </div>
              </div>

              <div className="flex justify-center">
                <div className="inline-flex rounded-full ring-1 ring-accent/25 shadow-[0_0_30px_-8px_rgba(232,147,95,0.45)]">
                  <div ref={buttonRef} />
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-textFaint text-[11px] text-center mt-5">
                <Sparkles size={11} className="text-accent/70" />
                Sign in with Google to continue
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
