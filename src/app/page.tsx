import Link from "next/link";
import { ArrowRight, ArrowUpRight, Network, Scale, Radar, Waypoints, ShieldCheck, Stamp } from "lucide-react";
import Nav from "@/components/Nav";
import { LogoMark } from "@/components/Logo";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import HeroOrb from "@/components/landing/HeroOrb";
import AnalyzeCard from "@/components/landing/AnalyzeCard";
import { TrustGraph, MechanismBars, ChainGrid, CrossChecks } from "@/components/landing/Viz";
import BlurText from "@/components/reactbits/BlurText";
import ShinyText from "@/components/reactbits/ShinyText";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import LogoLoop from "@/components/reactbits/LogoLoop";
import { ATTESTATIONS, EPOCH, EPOCH_ANOMALIES, FOCUS, NOTARIZED, TOOLS, TRACE, VERDICT } from "@/lib/showcase";

const SOURCES = [
  "Octant",
  "Gitcoin Grants",
  "Open Source Observer",
  "GitHub",
  "Octant forum",
  "Optimism RetroPGF",
  "BNB Smart Chain",
  "opBNB",
  "Ethereum",
  "Base",
  "Optimism",
  "Arbitrum",
  "Mantle",
  "Scroll",
  "Linea",
  "zkSync Era",
];

const SPOT = "rgba(156, 67, 254, 0.16)" as const;

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="sky pointer-events-none absolute inset-0" aria-hidden />
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[900px]" aria-hidden />

      <div className="relative">
        <Nav />

        {/* ─── Hero: copy left, the agent (Orb) right ─── */}
        <section className="mx-auto grid max-w-6xl items-center gap-6 px-5 pt-12 pb-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div>
            <span className="chip rise">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-good" aria-hidden />
              <ShinyText text="Live on Octant · BNB Chain first" color="#a6a1c4" shineColor="#ffffff" speed={3} />
            </span>

            <h1 className="sr-only">Evidence over narrative.</h1>
            <div aria-hidden className="mt-6 font-display text-5xl leading-[1.04] font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              <BlurText text="Evidence over" delay={120} className="text-ink" />
              <BlurText text="narrative." delay={120} className="text-glow text-violet-bright" />
            </div>

            <p className="rise mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-dim" style={{ animationDelay: "250ms" }}>
              Tessera is an autonomous agent for public-goods funding. It decides which evidence to pull — Octant
              rounds, donor overlap, mechanism replays, eleven chains — and reasons to a verdict where every figure
              traces back to a tool call.
            </p>

            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "380ms" }}>
              <LiquidMetalButton href="/dashboard" variant="primary" label="Run the agent" icon={<ArrowRight size={16} strokeWidth={2.4} />} />
              <LiquidMetalButton href="#evidence" label="See a real run" />
            </div>

            <dl className="rise mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6" style={{ animationDelay: "500ms" }}>
              <Stat value={TOOLS.length} label="agent tools" />
              <Stat value={11} label="chains scanned, BNB first" />
              <Stat value={EPOCH_ANOMALIES.donations} label="donations screened" />
            </dl>
          </div>

          <HeroOrb />
        </section>

        {/* ─── The calculator: start a run ─── */}
        <section className="mx-auto max-w-5xl px-5 pb-24">
          <AnalyzeCard />
        </section>

        {/* ─── One real run ─── */}
        <section id="evidence" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-24">
          <SectionHead
            eyebrow="One real run"
            title={`${FOCUS.name}, Octant epoch ${EPOCH}`}
            sub={`Payout address ${FOCUS.short}, analysed on 2026-10-02 and notarised on BNB Chain. ${TRACE.length} tool calls, chosen by the agent, in the order it made them.`}
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <ol className="glass divide-y divide-line/70 p-2 sm:p-3">
              {TRACE.map((t, i) => (
                <li key={t.tool} className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-1 px-3 py-3 sm:grid-cols-[2rem_12rem_1fr]">
                  <span className="font-mono text-[0.7rem] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-[0.78rem] text-cyan">{t.tool}</span>
                  <span className="col-start-2 text-[0.86rem] text-ink-dim sm:col-start-3">{t.result}</span>
                </li>
              ))}
            </ol>

            <div className="flex flex-col gap-5">
              <div className="glass-strong relative overflow-hidden p-6">
                <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-good/15 blur-3xl" aria-hidden />
                <p className="eyebrow flex items-center gap-2">
                  <Stamp size={13} /> Verdict
                </p>
                <p className="mt-3 font-display text-3xl font-semibold text-good">{VERDICT.call}</p>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-dim">{VERDICT.why}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 font-mono text-[0.74rem]">
                  <a href={NOTARIZED.url} target="_blank" rel="noopener noreferrer" className="link-grow inline-flex items-center gap-1 text-cyan">
                    notarised on BNB Chain · {NOTARIZED.short} <ArrowUpRight size={12} />
                  </a>
                  <Link href={NOTARIZED.verify} className="link-grow text-ink-dim">
                    verify this report
                  </Link>
                </div>
              </div>

              <div className="glass p-6">
                <p className="eyebrow">The whole epoch</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                  <Stat value={EPOCH_ANOMALIES.donations} label="donations" />
                  <Stat value={EPOCH_ANOMALIES.donors} label="unique donors" />
                  <Stat value={EPOCH_ANOMALIES.top10Share} suffix="%" label="of funding from the top 10% of donors" tone="warn" />
                  <Stat value={EPOCH_ANOMALIES.identicalDonations} label="identical 0.002 ETH donations flagged" tone="warn" />
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ─── What the agent can see ─── */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <SectionHead
            eyebrow="Instruments"
            title="What the agent can see"
            sub={`Each card is drawn from the same epoch-${EPOCH} run — real values, not illustrations.`}
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <SpotlightCard spotlightColor={SPOT} className="border-line! bg-surface/70! p-6!">
              <CardHead icon={Network} title="Trust-graph forensics">
                Donor overlap between all 24 projects in epoch 10. rotki (violet) shares the most donors with
                the epoch&apos;s top-funded project (amber edge), Jaccard 0.31 — far below the 0.7 coordination flag.
              </CardHead>
              <div className="mt-5 rounded-2xl border border-line bg-void/50 p-3">
                <TrustGraph />
              </div>
            </SpotlightCard>

            <SpotlightCard spotlightColor={SPOT} className="border-line! bg-surface/70! p-6!">
              <CardHead icon={Scale} title="Mechanism simulation">
                The same epoch replayed under four funding rules. rotki would receive more under every one of
                them than it actually got — the opposite of a whale-propped allocation.
              </CardHead>
              <div className="mt-5">
                <MechanismBars />
              </div>
              <p className="mt-4 font-mono text-[0.68rem] text-ink-faint">
                Gini is for the whole round — lower means funds are spread more evenly.
              </p>
            </SpotlightCard>

            <SpotlightCard spotlightColor={SPOT} className="border-line! bg-surface/70! p-6!">
              <CardHead icon={Radar} title="On-chain reconnaissance">
                Eleven EVM chains probed in parallel, BNB Chain networks first: balances, transactions, contract
                status, stablecoins.
              </CardHead>
              <div className="mt-5">
                <ChainGrid />
              </div>
            </SpotlightCard>

            <SpotlightCard spotlightColor={SPOT} className="border-line! bg-surface/70! p-6!">
              <CardHead icon={Waypoints} title="Cross-ecosystem validation">
                Independent sources instead of self-report. When a source has nothing, the report says so instead of
                guessing.
              </CardHead>
              <div className="mt-4">
                <CrossChecks />
              </div>
            </SpotlightCard>
          </div>
        </section>

        {/* ─── Method ─── */}
        <section id="method" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-20">
          <SectionHead eyebrow="The method" title="A real tool-calling loop, not a wrapper" />

          <div className="relative mt-10 grid gap-5 md:grid-cols-3">
            <div
              className="pointer-events-none absolute top-11 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-violet/0 via-violet/60 to-cyan/0 md:block"
              aria-hidden
            />
            {[
              { n: "01", t: "Decide", d: "Given an address or a proposal, the model picks the next tool from what it still needs to know." },
              { n: "02", t: "Gather", d: "Tools run inside the Tessera process against live sources. No tool endpoint is exposed to the network." },
              { n: "03", t: "Reason", d: "It weighs counterfactual impact, Sybil risk and mechanism sensitivity, then writes a verdict and a PDF." },
            ].map((s) => (
              <div key={s.n} className="glass relative p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-violet/40 bg-violet/15 font-mono text-[0.78rem] text-violet-bright">
                  {s.n}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-ink">{s.t}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-dim">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <span key={t} className="tile px-3 py-1.5 font-mono text-[0.7rem] text-ink-dim">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 text-[0.82rem] text-ink-faint sm:flex-row sm:items-center sm:gap-8">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-good" /> Tools execute in-process — no public tool endpoints.
            </span>
            <a href={ATTESTATIONS.url} target="_blank" rel="noopener noreferrer" className="link-grow flex items-center gap-2">
              <Stamp size={15} className="text-warn" /> Verdicts are notarised on BNB Chain · BAS schema {ATTESTATIONS.short}
            </a>
          </div>
        </section>

        {/* ─── Sources ─── */}
        <section className="pb-24" aria-label="Data sources">
          <p className="eyebrow mb-6 text-center">Grounded in</p>
          <LogoLoop
            logos={SOURCES.map((s) => ({ node: <span className="chip text-[0.78rem] text-ink-dim">{s}</span>, title: s }))}
            speed={50}
            logoHeight={34}
            gap={14}
            pauseOnHover
            fadeOut
            fadeOutColor="#07060d"
            ariaLabel="Data sources Tessera reads"
          />
        </section>

        {/* ─── Footer card ─── */}
        <footer className="mx-auto max-w-6xl px-5 pb-10">
          <div className="glass-strong relative overflow-hidden p-8 sm:p-12">
            <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-violet/25 blur-3xl" aria-hidden />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
              <div>
                <LogoMark size={38} />
                <h2 className="mt-5 max-w-xl text-3xl font-semibold text-ink sm:text-4xl">
                  Point it at a project. Read the evidence.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <LiquidMetalButton href="/dashboard" variant="primary" label="Open the console" icon={<ArrowRight size={16} strokeWidth={2.4} />} />
                <LiquidMetalButton
                  href="https://github.com/TesseraBNB/Tessera-backend#run-it-locally"
                  external
                  label="Run it locally"
                  icon={<ArrowUpRight size={15} />}
                />
              </div>
            </div>
            <div className="relative mt-10 flex flex-col justify-between gap-3 border-t border-line pt-6 font-mono text-[0.72rem] text-ink-faint sm:flex-row">
              <span>Tessera · public-goods intelligence</span>
              <a href="https://github.com/TesseraBNB" target="_blank" rel="noopener noreferrer" className="link-grow">
                github.com/TesseraBNB
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-dim">{sub}</p>}
    </div>
  );
}

function CardHead({ icon: Icon, title, children }: { icon: typeof Network; title: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet/30 bg-violet/10 text-violet-bright">
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-dim">{children}</p>
    </div>
  );
}

function Stat({ value, label, suffix, tone }: { value: number; label: string; suffix?: string; tone?: "warn" }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className={`font-display text-2xl font-semibold sm:text-3xl ${tone === "warn" ? "text-warn" : "text-ink"}`}>
        <CountUp to={value} separator="," duration={1.6} />
        {suffix}
      </dd>
      <dd className="mt-1 text-[0.76rem] leading-snug text-ink-faint" aria-hidden>
        {label}
      </dd>
    </div>
  );
}
