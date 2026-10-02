// Figures for the landing page. The run is a live agent analysis of rotki on
// 2026-10-02, served by the hosted API and notarised on BNB Chain; every number
// below is copied from its evidence file (each tool call with its raw result):
//   https://tessera-api-production-bef4.up.railway.app/api/reports/project_analysis__0x9531c059098e3d194ff8_20261002_085356.evidence.json
// Epoch-wide figures and the donor graph come from live Octant data
// (backend repo: Slides/deck/data.json). Octant's closed epochs do not change.

export const EPOCH = 10;

export const FOCUS = {
  address: "0x9531c059098e3d194ff87febb587ab07b30b1306",
  short: "0x9531…1306",
  // the agent learned the name from its own tools (Gitcoin + OSO, matched by address)
  name: "rotki",
};

/** The run's tool calls, in the order the agent made them. */
export const TRACE: { tool: string; input: string; result: string }[] = [
  { tool: "get_current_epoch", input: "—", result: "current epoch 17 · latest funded epoch 10" },
  { tool: "find_in_gitcoin", input: "address", result: "matched by address as rotki: 50 rounds since Feb 2020, 28,850 unique donors, $165,242 donated + $448,564 matched" },
  { tool: "get_oso_metrics", input: "address", result: "3,398 stars · 575 contributors · 18,296 commits · $1.86M received from 7 funding sources" },
  { tool: "get_project_history", input: "address", result: "7 Octant epochs (1–6, 10), 123.19 ETH in total · donors 192 → 49" },
  { tool: "rank_projects", input: "epoch 10", result: "#11 of 24, composite score 14.73" },
  { tool: "get_trust_profile", input: "epoch 10", result: "donor diversity 0.414 · whale dependency 0.431 · 32 of 49 donors repeat" },
  { tool: "simulate_mechanisms", input: "epoch 10", result: "rotki gains under every rule: +91.5% standard QF · +106% trust-weighted · +132% one-person-one-vote" },
  { tool: "scan_chain", input: "address", result: "active on 5 of 11 chains · 662 txs (Optimism 220, Ethereum 217, Arbitrum 208, Base 17)" },
  { tool: "get_github_signals", input: "rotki/rotki", result: "4,041 stars · 768 forks · last push the day of the run" },
  { tool: "find_in_retropgf", input: "name", result: "no RetroPGF match by name (OSO records $799,912 of Optimism Retro Funding)" },
  { tool: "get_forum_sentiment", input: "rotki", result: "4 Octant forum topics · 65 replies from 6 authors" },
  { tool: "get_gitcoin_trust_profile", input: "42161:608", result: "GG22 OSS dApps: 312 donors · diversity 0.758 · whale dependency 0.145 · max overlap 0.168" },
];

export const VERDICT = {
  call: "Fund",
  why: "Funded since 2020 across 50 Gitcoin rounds and 7 Octant epochs, $1.86M from seven sources, and an active codebase (18,296 commits, 575 contributors). Its share grows under every alternative funding rule. Risks it names: the Octant donor base fell from 192 to 49 and one donor gives 43% of its epoch-10 allocations, while its Gitcoin donors are far broader (diversity 0.76).",
};

/** The run's verdict on BNB Chain (BNB Attestation Service, BSC testnet). */
export const NOTARIZED = {
  uid: "0x658f69a6952bca3e1bdc1aba86df2b788460ceb21e1b1ff1e8cc9d9184dd8b48",
  short: "0x658f…8b48",
  url: "https://www.testnet.bascan.io/attestation/0x658f69a6952bca3e1bdc1aba86df2b788460ceb21e1b1ff1e8cc9d9184dd8b48",
  verify: "/verify?uid=0x658f69a6952bca3e1bdc1aba86df2b788460ceb21e1b1ff1e8cc9d9184dd8b48",
};

/** /api/detect-anomalies?epoch=10 */
export const EPOCH_ANOMALIES = {
  donations: 1177,
  donors: 254,
  totalEth: 14.84,
  top10Share: 96.9,
  identicalDonations: 24,
};

/** simulate_mechanisms, epoch 10: Gini of the whole round + rotki's change vs what it received */
export const MECHANISMS: { name: string; gini: number; change: number }[] = [
  { name: "Standard QF", gini: 0.396, change: 91.5 },
  { name: "Trust-weighted QF", gini: 0.372, change: 106.0 },
  { name: "Capped QF (10%)", gini: 0.363, change: 113.3 },
  { name: "One person, one vote", gini: 0.167, change: 131.8 },
];

/** scan_chain on rotki's address: BNB Chain networks first, as the scanner orders them */
export const CHAINS: { name: string; id: number; txs: number }[] = [
  { name: "BNB Smart Chain", id: 56, txs: 0 },
  { name: "opBNB", id: 204, txs: 0 },
  { name: "Ethereum", id: 1, txs: 217 },
  { name: "Base", id: 8453, txs: 17 },
  { name: "Optimism", id: 10, txs: 220 },
  { name: "Arbitrum", id: 42161, txs: 208 },
  { name: "Mantle", id: 5000, txs: 0 },
  { name: "Scroll", id: 534352, txs: 0 },
  { name: "Linea", id: 59144, txs: 0 },
  { name: "zkSync Era", id: 324, txs: 0 },
  { name: "BSC Testnet", id: 97, txs: 0 },
];

/** Cross-ecosystem lookups and what they returned for rotki */
export const CROSS_CHECKS: { source: string; status: string; found: boolean }[] = [
  { source: "Gitcoin Grants", status: "50 rounds · $613,806", found: true },
  { source: "Open Source Observer", status: "$1.86M from 7 sources", found: true },
  { source: "GitHub", status: "4,041 stars", found: true },
  { source: "Octant forum", status: "4 topics · 65 replies", found: true },
  { source: "Optimism RetroPGF", status: "name lookup missed it", found: false },
];

/** Tessera's verdict schema on the BNB Attestation Service (BSC testnet). */
export const ATTESTATIONS = {
  schemaUid: "0xcd4d38906641353fefefe1caabcba23f730b0512039c1b3c5478d47cf97373f8",
  short: "0xcd4d…73f8",
  url: "https://www.testnet.bascan.io/schema/0xcd4d38906641353fefefe1caabcba23f730b0512039c1b3c5478d47cf97373f8",
};

/** The agent's tools, as the Go registry names them. */
export const TOOLS = [
  "get_current_epoch",
  "get_project_history",
  "rank_projects",
  "get_trust_profile",
  "simulate_mechanisms",
  "scan_chain",
  "find_in_gitcoin",
  "get_gitcoin_round",
  "get_gitcoin_trust_profile",
  "get_oso_metrics",
  "get_github_signals",
  "get_forum_sentiment",
  "find_in_retropgf",
];
