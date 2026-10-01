# Tessera UI — design brief

**Style:** Glass (dark, violet). Reference: the purple glass landing in
`../References/` — centered pill nav, copy left / glowing orb right with floating
chips, one glowing "calculator" card, a row of feature cards, a footer card.

**Process being represented:** a skeptical analyst agent. It *decides* which tool
to call, *gathers* live evidence (Octant rounds, donor overlap, mechanism replays,
11-chain scans, OSO/GitHub/forum/RetroPGF), then *reasons* to a verdict.

| Step | Physical object | On screen |
| --- | --- | --- |
| The agent | a lens that pulls evidence in | React Bits **Orb** (WebGL), mosaic mark at its core |
| Evidence | readings taken by instruments | glass chips orbiting the Orb, each `tool → reading` from a real run |
| Trust graph | a donor-overlap network | SVG graph of epoch 10's 24 projects, edge weight = Jaccard |
| Mechanisms | four rule sets on one allocation | diverging bars: the focus project's change per mechanism |
| On-chain scan | a row of chain probes | 11 cells, filled where the address has transactions |
| Verdict | a stamped report | trace timeline ending in the verdict + PDF |

**Data rule:** every number on the landing comes from `examples/agent-trace-epoch10.md`
or `Slides/deck/data.json` (live Octant data, epoch 10). Nothing illustrative.

**Tokens:** `ink` text (#f1eefc / dim #a6a1c4 / faint #6e6890) on `night` surfaces
(#07060d → #0e0c18 → #151226), hairlines violet-tinted. Accents follow the Orb's own
palette: `violet` #9c43fe (primary action, agent), `cyan` #4cc2e9 (live data, tool
calls), `indigo` #101499 (depth). Status: good #4ade9a, warn #f5b544, bad #f0607a.

**Type:** Sora (display, tight), Manrope (UI), JetBrains Mono (data, tool names).

**Motion (3 layers):** ambient — Orb shader + slow chip float + logo loop;
entrance — BlurText headline, CountUp stats, staged section rise; interaction —
SpotlightCard cursor light, BorderGlow edge glow, Orb hover warp. Reduced motion
drops entrance travel, hover lift and smooth scroll but keeps the slow ambient
loops (the Orb is the hero); content never hides.

**React Bits used:** Orb, BlurText, ShinyText, CountUp, SpotlightCard, BorderGlow,
LogoLoop — vendored unchanged in `src/components/reactbits/` from the reactbits.dev
registry (`<Name>-TS-TW`).
