import Link from "next/link";
import { ArrowRight, Network, Scale, Boxes, Globe, ShieldCheck, Cpu } from "lucide-react";
import Nav from "@/components/Nav";
import { LogoMark } from "@/components/Logo";

const TOOLS = [
  "epoch",
  "history",
  "ranking",
  "trust-graph",
  "mechanisms",
  "on-chain",
  "oso",
  "github",
  "forum",
  "retropgf",
];

const CAPS = [
  {
    icon: Network,
    title: "Trust-graph forensics",
    body: "Shannon-entropy donor diversity, Jaccard donor overlap, and whale-dependency ratios surface Sybil and coordination risk that funding totals hide.",
  },
  {
    icon: Scale,
    title: "Mechanism simulation",
    body: "Replays each epoch under Standard, Capped, Equal-weight, and Trust-weighted quadratic funding — with Gini and top-share — to test how robust an allocation really is.",
  },
  {
    icon: Boxes,
    title: "On-chain reconnaissance",
    body: "Scans an address across eleven EVM chains (BNB Chain first) for native balance, transaction history, contract status, and stablecoin holdings.",
  },
  {
    icon: Globe,
    title: "Cross-ecosystem validation",
    body: "Corroborates a project against Open Source Observer, GitHub, the Octant forum, and Optimism RetroPGF — independent signals, not self-report.",
  },
];

const SOURCES = [
  "Octant",
  "Gitcoin",
  "Open Source Observer",
  "GitHub",
  "Octant forum",
  "Optimism RetroPGF",
  "BNB Chain + 10 EVM chains",
];

export default function Home() {
  return (
    <div className="grain relative min-h-screen overflow-hidden">
      <div className="tess-field pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="glow-ember pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 opacity-70" aria-hidden />
      <div className="relative">
        <Nav />

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 sm:pt-28">
          <p className="label rise" style={{ animationDelay: "0ms" }}>
            Autonomous public-goods intelligence
          </p>
          <h1
            className="rise mt-5 max-w-4xl font-display text-5xl leading-[1.05] text-bone sm:text-7xl"
            style={{ animationDelay: "60ms" }}
          >
            Evidence over <span className="italic text-ember">narrative.</span>
          </h1>
          <p
            className="rise mt-6 max-w-2xl text-lg leading-relaxed text-bone-dim"
            style={{ animationDelay: "140ms" }}
          >
            Tessera is an autonomous agent that evaluates Ethereum public-goods funding the way a
            skeptical analyst would — pulling live on-chain, trust-graph, and ecosystem data, then
            reasoning to a verdict you can defend. Every figure is traced to a tool call, never invented.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "220ms" }}>
            <Link href="/dashboard" className="btn btn-ember">
              Run the agent <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
            <a href="#method" className="btn btn-ghost">
              How it works
            </a>
            <span className="ml-1 inline-flex items-center gap-2 font-mono text-[0.72rem] tracking-wide text-bone-faint">
              <Cpu size={13} /> Claude Opus 4.8 · via Hermes
            </span>
          </div>
        </section>

        {/* Live agent showcase */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="panel relative overflow-hidden p-6 sm:p-8">
            <div className="glow-signal pointer-events-none absolute -right-20 -top-20 h-64 w-64 opacity-60" aria-hidden />
            <div className="relative flex items-center justify-between">
              <p className="label">Live agent trace</p>
              <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] text-signal">
                <span className="h-1.5 w-1.5 rounded-full bg-signal pulse-soft" /> streaming
              </span>
            </div>

            <div className="relative mt-5 flex flex-wrap gap-1.5">
              {TOOLS.map((t, i) => (
                <span
                  key={t}
                  className={`tile inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[0.68rem] tracking-wide ${
                    i < 5 ? "tile-active text-signal-bright" : "text-bone-faint"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rotate-45 ${i < 5 ? "bg-signal" : "bg-bone-faint/40"}`} />
                  {t}
                </span>
              ))}
            </div>

            <div className="relative mt-6 space-y-2.5 font-mono text-[0.82rem]">
              <TraceLine glyph="call" tone="signal">get_project_history <span className="text-bone-faint">address=0x4f…b21</span></TraceLine>
              <TraceLine glyph="result">found in 5 epochs · 18.4 ETH allocated · 1,204 unique donors</TraceLine>
              <TraceLine glyph="call" tone="signal">get_trust_profile <span className="text-bone-faint">epoch=5</span></TraceLine>
              <TraceLine glyph="result">donor diversity 0.91 · whale dependency 6% · coordination risk 0.12</TraceLine>
              <TraceLine glyph="think">Donor base is broad and organic; whale exposure is low. Cross-checking on-chain reality…</TraceLine>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="font-display text-3xl text-bone sm:text-4xl">What the agent can see</h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {CAPS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-surface p-6 transition-colors hover:bg-raised">
                  <Icon size={22} className="text-ember" strokeWidth={1.8} />
                  <h3 className="mt-4 text-lg text-bone">{c.title}</h3>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-bone-dim">{c.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="method" className="mx-auto max-w-6xl px-5 pb-20">
          <p className="label">The method</p>
          <h2 className="mt-1 max-w-3xl font-display text-3xl text-bone sm:text-4xl">
            A real tool-calling loop, not a wrapper
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Decide", d: "Given a project or proposal, the agent chooses which tools to call — and in what order — based on what it still needs to know." },
              { n: "02", t: "Gather", d: "Each tool runs inside Tessera against live sources and returns real data. Nothing is exposed to the network; nothing is fabricated." },
              { n: "03", t: "Reason", d: "It weighs the evidence — counterfactual impact, Sybil risk, mechanism sensitivity — then writes a verdict and a downloadable PDF." },
            ].map((s) => (
              <div key={s.n} className="panel p-6">
                <span className="font-mono text-sm text-signal">{s.n}</span>
                <h3 className="mt-3 text-xl text-bone">{s.t}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-bone-dim">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2.5 font-mono text-[0.78rem] text-bone-faint">
            <ShieldCheck size={15} className="text-good" />
            Tools execute in-process — no public tool endpoints, no SSRF surface.
          </div>
        </section>

        {/* Sources */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <p className="label mb-4">Grounded in</p>
          <div className="flex flex-wrap gap-2.5">
            {SOURCES.map((s) => (
              <span key={s} className="rounded-full border border-line px-4 py-2 font-mono text-[0.76rem] text-bone-dim">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="panel-raised relative overflow-hidden p-10 text-center">
            <div className="tess-field pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <div className="relative">
              <LogoMark size={40} />
              <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl text-bone sm:text-4xl">
                Point it at a project. Watch it find the truth.
              </h2>
              <div className="mt-7 flex justify-center">
                <Link href="/dashboard" className="btn btn-ember">
                  Open the console <ArrowRight size={16} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
            <div className="flex items-center gap-2.5 text-bone-faint">
              <LogoMark size={20} />
              <span className="font-mono text-[0.75rem]">Tessera · public-goods intelligence</span>
            </div>
            <a
              href="https://github.com/yeheskieltame/Tessera"
              target="_blank"
              rel="noopener noreferrer"
              className="link-grow font-mono text-[0.75rem] text-bone-dim"
            >
              github.com/yeheskieltame/Tessera
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function TraceLine({
  glyph,
  tone,
  children,
}: {
  glyph: "call" | "result" | "think";
  tone?: "signal";
  children: React.ReactNode;
}) {
  const mark =
    glyph === "call" ? (
      <span className="mt-1.5 h-2 w-2 rotate-45 bg-signal" />
    ) : glyph === "result" ? (
      <span className="mt-1.5 h-2 w-2 rotate-45 border border-good bg-good/30" />
    ) : (
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ember" />
    );
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0" aria-hidden>{mark}</span>
      <span className={tone === "signal" ? "text-signal-bright" : "text-bone-dim"}>{children}</span>
    </div>
  );
}
