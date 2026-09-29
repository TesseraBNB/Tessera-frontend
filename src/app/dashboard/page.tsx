"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Search, FlaskConical, BarChart3, ArrowRight } from "lucide-react";
import Nav from "@/components/Nav";
import AgentStream from "@/components/AgentStream";
import Prose from "@/components/Prose";
import {
  streamAgent,
  reportURL,
  analyzeEpoch,
  detectAnomalies,
  getCurrentEpoch,
  type AgentEvent,
  type EpochProject,
  type AnomalyReport,
} from "@/lib/api";

type Mode = "analyze" | "evaluate" | "explore";

const MODES: { id: Mode; label: string; icon: typeof Search }[] = [
  { id: "analyze", label: "Analyze project", icon: Search },
  { id: "evaluate", label: "Evaluate proposal", icon: FlaskConical },
  { id: "explore", label: "Explore epoch", icon: BarChart3 },
];

export default function Dashboard() {
  const [mode, setMode] = useState<Mode>("analyze");

  return (
    <div className="grain relative min-h-screen">
      <div className="tess-field pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative">
        <Nav />
        <main className="mx-auto max-w-6xl px-5 py-10">
          <header className="mb-8">
            <p className="label">Console</p>
            <h1 className="mt-1 font-display text-4xl text-bone">Run the agent</h1>
          </header>

          <div className="mb-8 flex flex-wrap gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`btn ${active ? "btn-ember" : "btn-ghost"}`}
                  aria-pressed={active}
                >
                  <Icon size={15} strokeWidth={2.2} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {mode === "explore" ? <ExploreView /> : <AgentView mode={mode} />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────── Agent flows (analyze / evaluate) ─────────────── */

function AgentView({ mode }: { mode: "analyze" | "evaluate" }) {
  const [address, setAddress] = useState("");
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
          setError(e.error ?? "agent error");
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
    !running &&
    (mode === "analyze"
      ? /^0x[a-fA-F0-9]{40}$/.test(address.trim())
      : Boolean(name.trim() && description.trim()));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div className="panel p-5">
          {mode === "analyze" ? (
            <Field label="Octant project address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x…"
                spellCheck={false}
                className="input"
                onKeyDown={(e) => e.key === "Enter" && canRun && start()}
              />
            </Field>
          ) : (
            <div className="space-y-4">
              <Field label="Project name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Protocol Guild" className="input" />
              </Field>
              <Field label="Description / proposal">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does the project do, and why does it matter as a public good?"
                  rows={4}
                  className="input resize-y"
                />
              </Field>
              <Field label="GitHub URL (optional)">
                <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/org/repo" spellCheck={false} className="input" />
              </Field>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button onClick={start} disabled={!canRun} className="btn btn-ember">
              {running ? <Loader2 size={15} className="spin" /> : <ArrowRight size={15} strokeWidth={2.4} />}
              {running ? "Agent running…" : "Run agent"}
            </button>
            {running && (
              <button
                onClick={() => {
                  stopRef.current?.();
                  setRunning(false);
                }}
                className="btn btn-ghost"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="panel border-bad/40 p-4">
            <p className="font-mono text-[0.8rem] text-bad">{error}</p>
          </div>
        )}

        {(running || events.length > 0) && (
          <div className="panel p-5">
            <p className="label mb-4">Live agent trace</p>
            <AgentStream events={events} running={running} />
          </div>
        )}

        {report && (
          <div className="panel relative overflow-hidden p-6">
            <div className="glow-signal pointer-events-none absolute -top-24 right-0 h-48 w-48 opacity-50" aria-hidden />
            <div className="relative mb-4 flex items-center justify-between">
              <p className="label">Report</p>
              {reportPath && (
                <a href={reportURL(reportPath)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <Download size={14} /> PDF
                </a>
              )}
            </div>
            <Prose markdown={report} />
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
      <span className="label mb-2 block">{label}</span>
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
      .then((e) => setEpoch(e.currentEpoch))
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
      <div className="panel flex flex-wrap items-end gap-4 p-5">
        <Field label="Octant epoch">
          <input
            type="number"
            value={epoch}
            onChange={(e) => setEpoch(e.target.value === "" ? "" : Number(e.target.value))}
            className="input w-32"
            min={1}
          />
        </Field>
        <button onClick={load} disabled={loading || epoch === ""} className="btn btn-ember">
          {loading ? <Loader2 size={15} className="spin" /> : <BarChart3 size={15} />}
          Load epoch
        </button>
      </div>

      {error && (
        <div className="panel border-bad/40 p-4">
          <p className="font-mono text-[0.8rem] text-bad">{error}</p>
        </div>
      )}

      {anomaly && (
        <div className="panel p-5">
          <p className="label mb-3">Funding anomalies</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Donations" value={anomaly.totalDonations.toLocaleString()} />
            <Stat label="Unique donors" value={anomaly.uniqueDonors.toLocaleString()} />
            <Stat label="Total ETH" value={anomaly.totalAmount.toFixed(2)} />
            <Stat label="Whale share" value={`${(anomaly.whaleConcentration * 100).toFixed(0)}%`} accent={anomaly.whaleConcentration > 0.5} />
          </div>
          {anomaly.flags.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {anomaly.flags.map((f, i) => (
                <li key={i} className="flex gap-2.5 font-mono text-[0.78rem] text-warn">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rotate-45 bg-warn" /> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="panel p-5">
          <p className="label mb-4">Composite ranking · {projects.length} projects</p>
          <div className="space-y-1.5">
            {projects.slice(0, 25).map((p) => (
              <div key={p.address} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-raised/60">
                <span className="w-7 shrink-0 font-mono text-[0.72rem] text-bone-faint">{String(p.rank).padStart(2, "0")}</span>
                <code className="w-32 shrink-0 truncate font-mono text-[0.76rem] text-bone-dim">{p.address}</code>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-void">
                  <div className="h-full rounded-full bg-gradient-to-r from-ember-deep to-ember" style={{ width: `${(p.score / max) * 100}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[0.76rem] text-bone">{p.score.toFixed(1)}</span>
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
      <p className="label">{label}</p>
      <p className={`mt-1 font-mono text-xl ${accent ? "text-bad" : "text-bone"}`}>{value}</p>
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
      <div className="panel p-5">
        <p className="label mb-3">How it works</p>
        <ol className="space-y-2.5 text-[0.82rem] text-bone-dim">
          {steps.map((t, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="font-mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="panel p-5">
        <p className="label mb-2">Tip</p>
        <p className="text-[0.82rem] leading-relaxed text-bone-dim">
          Try an Octant project address, or paste a proposal to score it across eight dimensions with live evidence.
        </p>
      </div>
    </aside>
  );
}
