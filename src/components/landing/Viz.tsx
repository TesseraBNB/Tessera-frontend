// Small data drawings for the landing's capability cards. Every mark is a real
// value from epoch 10 (lib/showcase.ts, lib/showcase-graph.ts).

import { GRAPH_EDGES, GRAPH_FOCUS, GRAPH_NODES } from "@/lib/showcase-graph";
import { CHAINS, CROSS_CHECKS, MECHANISMS } from "@/lib/showcase";

const W = 320;
const H = 190;
const PAD = 14;

/** Donor-overlap network: node area = funding, edge opacity = Jaccard overlap. */
export function TrustGraph() {
  const px = (x: number) => PAD + x * (W - 2 * PAD);
  const py = (y: number) => PAD + y * (H - 2 * PAD);
  const r = (eth: number) => 2.2 + Math.sqrt(eth) * 0.85;
  const strongest = GRAPH_EDGES.filter(([a, b]) => a === GRAPH_FOCUS || b === GRAPH_FOCUS).reduce((m, e) =>
    e[2] > m[2] ? e : m,
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Donor-overlap graph of epoch 10's 24 funded projects">
      {GRAPH_EDGES.map(([a, b, j], i) => {
        const focus = a === GRAPH_FOCUS || b === GRAPH_FOCUS;
        const top = strongest[0] === a && strongest[1] === b;
        return (
          <line
            key={i}
            x1={px(GRAPH_NODES[a][0])}
            y1={py(GRAPH_NODES[a][1])}
            x2={px(GRAPH_NODES[b][0])}
            y2={py(GRAPH_NODES[b][1])}
            stroke={top ? "var(--color-warn)" : focus ? "var(--color-cyan)" : "var(--color-violet-bright)"}
            strokeOpacity={top ? 0.95 : (focus ? 0.25 : 0.1) + j}
            strokeWidth={top ? 1.6 : 0.6 + j * 1.4}
          />
        );
      })}
      {GRAPH_NODES.map(([x, y, eth], i) =>
        i === GRAPH_FOCUS ? null : (
          <circle key={i} cx={px(x)} cy={py(y)} r={r(eth)} fill="var(--color-raised)" stroke="var(--color-violet-bright)" strokeOpacity={0.55} />
        ),
      )}
      <circle
        cx={px(GRAPH_NODES[GRAPH_FOCUS][0])}
        cy={py(GRAPH_NODES[GRAPH_FOCUS][1])}
        r={r(GRAPH_NODES[GRAPH_FOCUS][2]) + 5}
        fill="var(--color-violet)"
        opacity={0.25}
      />
      <circle
        cx={px(GRAPH_NODES[GRAPH_FOCUS][0])}
        cy={py(GRAPH_NODES[GRAPH_FOCUS][1])}
        r={r(GRAPH_NODES[GRAPH_FOCUS][2])}
        fill="var(--color-violet)"
      />
    </svg>
  );
}

/** The focus project's allocation change under each mechanism, diverging from zero. */
export function MechanismBars() {
  const max = Math.max(...MECHANISMS.map((m) => Math.abs(m.change)));
  return (
    <ul className="space-y-3">
      {MECHANISMS.map((m) => {
        const w = (Math.abs(m.change) / max) * 50;
        const up = m.change >= 0;
        return (
          <li key={m.name}>
            <div className="mb-1 flex justify-between font-mono text-[0.68rem] text-ink-faint">
              <span className="text-ink-dim">{m.name}</span>
              <span>Gini {m.gini.toFixed(3)}</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-void">
              <span className="absolute top-[-3px] left-1/2 h-4 w-px bg-line-bright" aria-hidden />
              <span
                className={`absolute top-0 h-full rounded-full ${up ? "bg-cyan" : "bg-bad"}`}
                style={up ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
              />
            </div>
            <p className={`mt-1 text-right font-mono text-[0.7rem] ${up ? "text-cyan" : "text-bad"}`}>
              {up ? "+" : "−"}
              {Math.abs(m.change).toFixed(1)}%
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** One cell per scanned chain; lit where the address has transactions. */
export function ChainGrid() {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {CHAINS.map((c) => {
        const active = c.txs > 0;
        const bnb = c.id === 56 || c.id === 204 || c.id === 97;
        return (
          <li
            key={c.id}
            className={`rounded-xl border px-2.5 py-2 ${
              active ? "border-cyan/60 bg-cyan/10 shadow-[0_0_18px_-6px_var(--color-cyan)]" : "border-line bg-void/50"
            }`}
          >
            <p className="truncate text-[0.72rem] text-ink-dim">{c.name}</p>
            <p className="mt-0.5 flex items-center justify-between font-mono text-[0.66rem]">
              <span className={active ? "text-cyan-bright" : "text-ink-faint"}>{c.txs} tx</span>
              {bnb && <span className="text-warn">BNB</span>}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** What each outside source returned; gaps stay visible as gaps. */
export function CrossChecks() {
  return (
    <ul className="divide-y divide-line">
      {CROSS_CHECKS.map((c) => (
        <li key={c.source} className="flex items-center justify-between gap-3 py-2.5">
          <span className="flex items-center gap-2.5 text-[0.86rem] text-ink-dim">
            <span className={`h-2 w-2 rounded-full ${c.found ? "bg-good" : "border border-ink-faint"}`} aria-hidden />
            {c.source}
          </span>
          <span className={`font-mono text-[0.7rem] ${c.found ? "text-good" : "text-ink-faint"}`}>{c.status}</span>
        </li>
      ))}
    </ul>
  );
}
