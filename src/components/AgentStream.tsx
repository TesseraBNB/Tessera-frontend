"use client";

import { useMemo } from "react";
import type { AgentEvent } from "@/lib/api";

// Tool catalog: display labels for the agent's tools, in roughly the order the
// agent tends to use them. Drives the tessellation strip.
const TOOLS: [string, string][] = [
  ["get_current_epoch", "Epoch"],
  ["get_project_history", "History"],
  ["rank_projects", "Ranking"],
  ["get_trust_profile", "Trust graph"],
  ["simulate_mechanisms", "Mechanisms"],
  ["scan_chain", "On-chain"],
  ["get_oso_metrics", "OSO"],
  ["get_github_signals", "GitHub"],
  ["get_forum_sentiment", "Forum"],
  ["find_in_retropgf", "RetroPGF"],
];

export default function AgentStream({
  events,
  running,
}: {
  events: AgentEvent[];
  running: boolean;
}) {
  const called = useMemo(
    () => new Set(events.filter((e) => e.type === "tool_call").map((e) => e.tool)),
    [events],
  );

  const activeTool = useMemo(() => {
    if (!running) return undefined;
    let active: string | undefined;
    for (const e of events) {
      if (e.type === "tool_call") active = e.tool;
      else if (e.type === "tool_result") active = undefined;
    }
    return active;
  }, [events, running]);

  const timeline = events.filter((e) => e.type === "tool_call" || e.type === "tool_result" || e.type === "text");
  const lastTextIdx = lastIndexOf(timeline, (e) => e.type === "text");

  return (
    <div className="space-y-5">
      {/* Tessellation strip — tiles light up as tools fire */}
      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {TOOLS.map(([name, label]) => {
          const on = called.has(name);
          const busy = activeTool === name;
          return (
            <span
              key={name}
              className={`tile inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[0.68rem] tracking-wide transition-all duration-300 ${
                on ? "tile-active text-signal-bright" : "text-bone-faint"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rotate-45 ${on ? "bg-signal" : "bg-bone-faint/40"} ${busy ? "pulse-soft" : ""}`}
              />
              {label}
            </span>
          );
        })}
      </div>

      {/* Event timeline */}
      <ol className="space-y-2.5">
        {timeline.map((e, i) => {
          if (e.type === "tool_call") {
            return (
              <li key={i} className="flex items-start gap-3 rise" style={{ animationDelay: `${Math.min(i, 8) * 20}ms` }}>
                <Glyph kind="call" />
                <div className="min-w-0">
                  <span className="font-mono text-[0.8rem] text-signal-bright">{labelFor(e.tool)}</span>
                  {summarize(e.input) && (
                    <span className="ml-2 font-mono text-[0.72rem] text-bone-faint">{summarize(e.input)}</span>
                  )}
                </div>
              </li>
            );
          }
          if (e.type === "tool_result") {
            return (
              <li key={i} className="flex items-start gap-3 pl-0.5">
                <Glyph kind={e.isError ? "error" : "result"} />
                <p className="min-w-0 truncate font-mono text-[0.72rem] text-bone-faint">
                  {e.isError ? "error: " : ""}
                  {preview(e.result)}
                </p>
              </li>
            );
          }
          // text (agent reasoning)
          return (
            <li key={i} className="flex items-start gap-3 rise">
              <Glyph kind="think" />
              <p className={`min-w-0 text-[0.9rem] leading-relaxed text-bone-dim ${running && i === lastTextIdx ? "cursor-blink" : ""}`}>
                {e.text}
              </p>
            </li>
          );
        })}

        {running && timeline.length === 0 && (
          <li className="flex items-center gap-3 text-bone-faint">
            <span className="spin h-3.5 w-3.5 rounded-full border-2 border-line-bright border-t-signal" />
            <span className="font-mono text-[0.78rem]">agent is thinking…</span>
          </li>
        )}
      </ol>
    </div>
  );
}

function Glyph({ kind }: { kind: "call" | "result" | "error" | "think" }) {
  const map = {
    call: <span className="mt-1 h-2 w-2 rotate-45 bg-signal" />,
    result: <span className="mt-1 h-2 w-2 rotate-45 border border-good bg-good/30" />,
    error: <span className="mt-1 h-2 w-2 rotate-45 bg-bad" />,
    think: <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ember" />,
  };
  return <span className="shrink-0" aria-hidden>{map[kind]}</span>;
}

function labelFor(tool?: string): string {
  if (!tool) return "tool";
  const found = TOOLS.find(([n]) => n === tool);
  return found ? found[1] : tool;
}

function summarize(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).filter(([, v]) => v !== "" && v != null);
    if (entries.length === 0) return "";
    return entries.map(([k, v]) => `${k}=${truncate(String(v), 24)}`).join("  ");
  }
  return truncate(String(input), 40);
}

function preview(s?: string): string {
  if (!s) return "done";
  const clean = s.replace(/\s+/g, " ").trim();
  return truncate(clean, 120);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function lastIndexOf<T>(arr: T[], pred: (x: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
}
