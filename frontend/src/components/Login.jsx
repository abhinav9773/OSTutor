import { useEffect, useRef } from "react";
import { Sparkles, FileText, MessageSquare, Cpu } from "lucide-react";
import TerminalTyper from "./TerminalTyper.jsx";
import { BASE_URL } from "../api.js";
import Logo from "./Logo.jsx";

// Module-level flag (not component state) - survives re-renders and
// React StrictMode's double-invoke in dev, so initialize() truly only
// ever runs once per page load. This is what fixes the "called multiple
// times" warning from Google's own library.
let googleInitialized = false;

export default function Login({ onLoginSuccess }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

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

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      shape: "pill",
      width: 220,
    });
  }, [onLoginSuccess]);

  return (
    <div className="relative flex min-h-screen bg-bg text-textPrimary font-body overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] animate-grid-drift"
        style={{
          backgroundImage:
            "linear-gradient(#e8935f 1px, transparent 1px), linear-gradient(90deg, #e8935f 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -top-32 -right-24 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(232,147,95,0.28),rgba(217,122,77,0.09)_45%,transparent_70%)] blur-[10px] animate-float-slow" />
      <div className="pointer-events-none absolute top-24 right-32 w-[110px] h-[110px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f5c396,#e8935f_55%,#b3653a_100%)] shadow-[0_0_80px_16px_rgba(232,147,95,0.22)] animate-pulse-glow" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(232,147,95,0.14),transparent_70%)] blur-[10px] animate-float-slower" />

      <div className="hidden lg:flex flex-col justify-center flex-1 relative z-10 px-16 xl:px-24">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-8">
            <Logo size={22} />
            <span className="font-display text-xl tracking-wide">OSTutor</span>
          </div>

          <div className="font-display text-[44px] xl:text-[52px] leading-[1.1] text-textPrimary mb-5 max-w-[560px]">
            Your Operating Systems
            <br />
            tutor, grounded in <span className="text-accent">
              your own
            </span>{" "}
            course material.
          </div>
          <div className="text-textFaint text-[15px] leading-relaxed max-w-[440px] mb-12">
            No fine-tuning, no hallucinated definitions - every answer is
            retrieved straight from your lecture notes, lab manuals, and past
            papers.
          </div>

          <div className="bg-panel/60 border border-panelBorder rounded-2xl p-5 backdrop-blur-sm max-w-[440px] h-[210px] flex flex-col">
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

      <div className="flex items-center justify-center w-full lg:w-[480px] relative z-10 px-6">
        <div className="relative w-full max-w-[360px] animate-fade-in-up">
          <div className="pointer-events-none absolute -inset-4 bg-[radial-gradient(circle_at_50%_20%,rgba(232,147,95,0.12),transparent_70%)] blur-md" />

          <div className="relative bg-panel border border-panelBorder rounded-[22px] px-8 py-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            <div className="flex lg:hidden items-center gap-2 mb-7">
              <Logo size={22} />
              <span className="font-display text-xl tracking-wide">
                OSTutor
              </span>
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
              <div ref={buttonRef} />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-textFaint text-[11px] text-center mt-5">
              <Sparkles size={11} className="text-accent/70" />
              Sign in with Google to continue
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
