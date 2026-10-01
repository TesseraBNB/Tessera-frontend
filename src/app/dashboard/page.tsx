"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, LoaderCircle, Search, FlaskConical, ChartColumn, ArrowRight, Square } from "lucide-react";
import Nav from "@/components/Nav";
import AgentStream from "@/components/AgentStream";
import Prose from "@/components/Prose";
import {
  API_CANDIDATES,
  streamAgent,
  reportURL,
  openReport,
  analyzeEpoch,
  detectAnomalies,
  getAgentInfo,
  getCurrentEpoch,
  type AgentEvent,
  type EpochProject,
  type AnomalyReport,
} from "@/lib/api";
import { FOCUS } from "@/lib/showcase";

const RUN_LOCALLY_URL = "https://github.com/TesseraBNB/Tessera-backend#run-it-locally";
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

type Mode = "analyze" | "evaluate" | "explore";

const MODES: { id: Mode; label: string; icon: typeof Search }[] = [
  { id: "analyze", label: "Analyze project", icon: Search },
  { id: "evaluate", label: "Evaluate proposal", icon: FlaskConical },
  { id: "explore", label: "Explore epoch", icon: ChartColumn },
];

export default function Dashboard() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="sky pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative">
        <Nav />
        <main className="mx-auto max-w-6xl px-5 pt-10 pb-20">
          <header className="mb-8">
            <p className="eyebrow">Console</p>
            <h1 className="mt-2 text-4xl font-semibold text-ink">Run the agent</h1>
          </header>

          <BackendNotice />

          {/* the console reads ?mode= and ?address= (links from the landing page) */}
          <Suspense fallback={<div className="skeleton h-64" />}>
            <Console />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Console() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(() => {
    const m = params.get("mode");
    return m === "evaluate" || m === "explore" ? m : "analyze";
  });
  const initialAddress = params.get("address") ?? "";

  return (
    <>
      <div className="glass mb-8 inline-flex flex-wrap gap-1 rounded-full p-1.5" role="group" aria-label="Console mode">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              aria-pressed={active}
              onClick={() => setMode(m.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.85rem] font-semibold transition-colors ${
                active ? "btn-primary text-white" : "text-ink-dim hover:text-ink"
              }`}
            >
              <Icon size={15} strokeWidth={2.2} />
              {m.label}
            </button>
          );
        })}
      </div>

      {mode === "explore" ? (
        <ExploreView />
      ) : (
        <AgentView key={mode} mode={mode} initialAddress={mode === "analyze" ? initialAddress : ""} />
      )}
    </>
  );
}

/* ─────────────── Backend reachability ─────────────── */

// The console talks to a Tessera backend the visitor runs locally; say how to
// start it (or enable the agent) instead of failing silently.
function BackendNotice() {
  const [state, setState] = useState<"checking" | "ok" | "offline" | "no-key">("checking");

  useEffect(() => {
    let live = true;
    getAgentInfo()
      .then((i) => live && setState(i.ready ? "ok" : "no-key"))
      .catch(() => live && setState("offline"));
    return () => {
      live = false;
    };
  }, []);

  if (state === "checking" || state === "ok") return null;

  return (
    <div className="glass mb-8 border-warn/40 p-5">
      <p className="eyebrow mb-2 text-warn">{state === "offline" ? "Backend not reachable" : "Agent disabled"}</p>
      <p className="text-[0.9rem] leading-relaxed text-ink-dim">
        {state === "offline" ? (
          <>
            This console looks for a Tessera backend at{" "}
            {API_CANDIDATES.map((b, i) => (
              <span key={b}>
                {i > 0 && " or "}
                <code className="font-mono text-ink">{b}</code>
              </span>
            ))}
            . Start one on your machine with <code className="font-mono text-ink">go run ./cmd/tessera serve</code>, then
            reload.{" "}
          </>
        ) : (
          <>
            The backend is running but has no AI key, so Explore works and agent runs are off. Set{" "}
            <code className="font-mono text-ink">ANTHROPIC_API_KEY</code> in its <code className="font-mono text-ink">.env</code>{" "}
            and restart it.{" "}
          </>
        )}
        <a href={RUN_LOCALLY_URL} target="_blank" rel="noopener noreferrer" className="link-grow text-cyan">
          Setup guide
        </a>
      </p>
    </div>
  );
}

/* ─────────────── Agent flows (analyze / evaluate) ─────────────── */

function AgentView({ mode, initialAddress }: { mode: "analyze" | "evaluate"; initialAddress: string }) {
  const [address, setAddress] = useState(initialAddress);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [github, setGithub] = useState("");

  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<string>();
  const [reportPath, setReportPath] = useState<string>();
  const [error, setError] = useState<string>();
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  const start = useCallback(() => {
    stopRef.current?.();
    setEvents([]);
    setReport(undefined);
    setReportPath(undefined);
    setError(undefined);
    setRunning(true);

    const path = mode === "analyze" ? "/api/agent/analyze" : "/api/agent/evaluate";
    const params =
      mode === "analyze"
        ? { address: address.trim() }
        : { name: name.trim(), description: description.trim(), githubURL: github.trim() };

    stopRef.current = streamAgent(path, params, {
      onEvent: (e) => {
        setEvents((prev) => [...prev, e]);
        if (e.type === "result") {
          setReport(e.report);
          setReportPath(e.reportPath);
          setRunning(false);
        } else if (e.type === "error") {
          // the agent's own error event carries its message in `text`
          setError(e.error ?? e.text ?? "agent error");
          setRunning(false);
        }
      },
      onError: (msg) => {
        setError(msg);
        setRunning(false);
      },
    });
  }, [mode, address, name, description, github]);

  const canRun =
    !running && (mode === "analyze" ? ADDRESS.test(address.trim()) : Boolean(name.trim() && description.trim()));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <form
          className="glass-strong p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canRun) start();
          }}
        >
          {mode === "analyze" ? (
            <Field label="Octant project address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x…"
                spellCheck={false}
                autoComplete="off"
                className="field"
              />
            </Field>
          ) : (
            <div className="space-y-4">
              <Field label="Project name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Protocol Guild" className="field" />
              </Field>
              <Field label="Description / proposal">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does the project do, and why does it matter as a public good?"
                  rows={4}
                  className="field resize-y"
                />
              </Field>
              <Field label="GitHub URL (optional)">
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  spellCheck={false}
                  className="field"
                />
              </Field>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!canRun} className="btn btn-primary">
              {running ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowRight size={15} strokeWidth={2.4} />}
              {running ? "Agent running…" : "Run agent"}
            </button>
            {running && (
              <button
                type="button"
                onClick={() => {
                  stopRef.current?.();
                  setRunning(false);
                }}
                className="btn btn-ghost"
              >
                <Square size={13} /> Stop
              </button>
            )}
            {mode === "analyze" && !running && address.trim() === "" && (
              <button type="button" onClick={() => setAddress(FOCUS.address)} className="link-grow font-mono text-[0.78rem] text-cyan">
                try {FOCUS.name} · {FOCUS.short}
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="glass border-bad/40 p-4" role="alert">
            <p className="font-mono text-[0.8rem] text-bad">{error}</p>
          </div>
        )}

        {(running || events.length > 0) && (
          <div className="glass p-6">
            <p className="eyebrow mb-4">Live agent trace</p>
            <AgentStream events={events} running={running} />
          </div>
        )}

        {report && (
          <div className="glass-strong relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-24 -right-10 h-56 w-56 rounded-full bg-violet/20 blur-3xl" aria-hidden />
            <div className="relative mb-4 flex items-center justify-between">
              <p className="eyebrow">Report</p>
              {reportPath && (
                <a
                  href={reportURL(reportPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost px-4 py-2"
                  onClick={(e) => {
                    e.preventDefault();
                    openReport(reportPath).catch((err: Error) => setError(`report: ${err.message}`));
                  }}
                >
                  <Download size={14} /> PDF
                </a>
              )}
            </div>
            <div className="relative">
              <Prose markdown={report} />
            </div>
          </div>
        )}
      </div>

      <SideRail />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}

/* ─────────────── Explore (quantitative, no LLM) ─────────────── */

function ExploreView() {
  const [epoch, setEpoch] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<EpochProject[]>([]);
  const [anomaly, setAnomaly] = useState<AnomalyReport | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getCurrentEpoch()
      .then((e) => setEpoch(e.latestFundedEpoch ?? e.currentEpoch))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (epoch === "") return;
    setLoading(true);
    setError(undefined);
    try {
      const [a, an] = await Promise.all([analyzeEpoch(Number(epoch)), detectAnomalies(Number(epoch))]);
      setProjects(a.projects);
      setAnomaly(an.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load epoch");
    } finally {
      setLoading(false);
    }
  }, [epoch]);

  const max = projects[0]?.score || 100;

  return (
    <div className="space-y-6">
      <form
        className="glass-strong flex flex-wrap items-end gap-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <Field label="Octant epoch">
          <input
            type="number"
            value={epoch}
            onChange={(e) => setEpoch(e.target.value === "" ? "" : Number(e.target.value))}
            className="field w-32"
            min={1}
          />
        </Field>
        <button type="submit" disabled={loading || epoch === ""} className="btn btn-primary">
          {loading ? <LoaderCircle size={15} className="animate-spin" /> : <ChartColumn size={15} />}
          Load epoch
        </button>
        <p className="basis-full text-[0.8rem] text-ink-faint sm:basis-auto">
          Composite ranking and anomaly scan — pure analytics, no AI key needed.
        </p>
      </form>

      {error && (
        <div className="glass border-bad/40 p-4" role="alert">
          <p className="font-mono text-[0.8rem] text-bad">{error}</p>
        </div>
      )}

      {anomaly && (
        <div className="glass p-6">
          <p className="eyebrow mb-4">Funding anomalies</p>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Donations" value={anomaly.totalDonations.toLocaleString()} />
            <Stat label="Unique donors" value={anomaly.uniqueDonors.toLocaleString()} />
            <Stat label="Total ETH" value={anomaly.totalAmount.toFixed(2)} />
            <Stat
              label="Top-10% donor share"
              value={`${(anomaly.whaleConcentration * 100).toFixed(1)}%`}
              accent={anomaly.whaleConcentration > 0.5}
            />
          </div>
          {anomaly.flags.length > 0 && (
            <ul className="mt-5 space-y-2">
              {anomaly.flags.map((f, i) => (
                <li key={i} className="flex gap-2.5 font-mono text-[0.78rem] text-warn">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" /> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="glass p-6">
          <p className="eyebrow mb-4">Composite ranking · {projects.length} projects</p>
          <div className="space-y-1">
            {projects.slice(0, 25).map((p) => (
              <div key={p.address} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.03]">
                <span className="w-7 shrink-0 font-mono text-[0.72rem] text-ink-faint">{String(p.rank).padStart(2, "0")}</span>
                <code className="w-24 shrink-0 truncate font-mono text-[0.74rem] text-ink-dim sm:w-36">{p.address}</code>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-void">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet to-cyan"
                    style={{ width: `${(p.score / max) * 100}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[0.76rem] text-ink">{p.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`mt-1.5 font-display text-2xl font-semibold ${accent ? "text-warn" : "text-ink"}`}>{value}</p>
    </div>
  );
}

/* ─────────────── Side rail ─────────────── */

function SideRail() {
  const steps = [
    "The agent decides which tools to call — Octant, on-chain, OSO, GitHub, forum, RetroPGF.",
    "Each call runs inside Tessera and returns real data, never invented figures.",
    "It reasons across the evidence, then writes a verdict you can download as a PDF.",
  ];
  return (
    <aside className="space-y-4">
      <div className="glass p-5">
        <p className="eyebrow mb-4">How it works</p>
        <ol className="space-y-3 text-[0.85rem] leading-relaxed text-ink-dim">
          {steps.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet/15 font-mono text-[0.66rem] text-violet-bright">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="glass p-5">
        <p className="eyebrow mb-2">Tip</p>
        <p className="text-[0.85rem] leading-relaxed text-ink-dim">
          Octant has allocation data for epochs 1–10. Explore ranks a whole epoch; Analyze takes one project&apos;s
          payout address; Evaluate scores a written proposal.
        </p>
      </div>
    </aside>
  );
}
