"use client";

import { useSyncExternalStore } from "react";
import Orb from "@/components/reactbits/Orb";
import { LogoMark } from "@/components/Logo";

// Readings the agent took in the recorded epoch-10 run (lib/showcase.ts), orbiting
// the Orb that stands for the agent. `hideSm` chips drop out on narrow screens.
const READINGS: { tool: string; value: string; tone?: "warn" | "bad"; pos: string; delay: string; hideSm?: boolean }[] = [
  { tool: "rank_projects", value: "#1 of 24 · epoch 10", pos: "left-[2%] top-[14%]", delay: "0s" },
  { tool: "scan_chain", value: "11 chains · active on 2", pos: "right-[0%] top-[8%]", delay: "1.2s", hideSm: true },
  { tool: "get_trust_profile", value: "whale dependency 45.8%", tone: "warn", pos: "left-0 top-[52%] sm:-left-[4%]", delay: "2.1s" },
  { tool: "get_project_history", value: "donors 80 → 52", pos: "right-[-2%] top-[58%]", delay: "0.6s", hideSm: true },
  { tool: "simulate_mechanisms", value: "−70% under 1p1v", tone: "bad", pos: "left-[22%] bottom-[4%]", delay: "1.6s" },
];

const REDUCED = "(prefers-reduced-motion: reduce)";

// Server snapshot is false so hydration matches; the static orb swaps in after.
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

export default function HeroOrb() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative h-[380px] w-full sm:h-[480px] lg:h-[600px]">
      {reduced ? (
        <div
          className="absolute inset-[12%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 38%, color-mix(in srgb, var(--color-violet) 60%, transparent) 46%, color-mix(in srgb, var(--color-cyan) 35%, transparent) 54%, transparent 66%)",
          }}
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0" aria-hidden>
          <Orb hoverIntensity={0.5} rotateOnHover={true} hue={0} forceHoverState={false} backgroundColor="#07060d" />
        </div>
      )}

      {/* the agent at the core */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3" aria-hidden>
        <LogoMark size={54} />
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-ink-dim">agent</span>
      </div>

      <ul className="pointer-events-none absolute inset-0" aria-label="Readings from a recorded run on Octant epoch 10">
        {READINGS.map((r) => (
          <li
            key={r.tool}
            className={`absolute ${r.pos} ${r.hideSm ? "hidden sm:block" : ""}`}
          >
            <span className="chip animate-float flex-col items-start gap-0.5 rounded-2xl px-3.5 py-2.5" style={{ animationDelay: r.delay }}>
              <span className="text-[0.62rem] text-cyan">{r.tool}</span>
              <span
                className={`font-sans text-[0.82rem] font-semibold ${
                  r.tone === "bad" ? "text-bad" : r.tone === "warn" ? "text-warn" : "text-ink"
                }`}
              >
                {r.value}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
