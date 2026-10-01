// Figures for the landing page, copied from a recorded agent run and live Octant
// data (backend repo: examples/agent-trace-epoch10.md, Slides/deck/data.json).
// Octant's closed epochs do not change, so these stay true.

export const EPOCH = 10;

export const FOCUS = {
  address: "0xe2F7cF9C2b12c0BfcdAB571F9E50418fC08F4AD1",
  short: "0xe2F7…4AD1",
  // name from Octant's project metadata on IPFS; the agent itself only sees the address
  name: "Solidity",
};

/** The run's tool calls, in the order the agent made them. */
export const TRACE: { tool: string; input: string; result: string }[] = [
  { tool: "get_project_history", input: "address", result: "epoch 8: 80 donors, 22.36 ETH · epoch 10: 52 donors, 46.29 ETH" },
  { tool: "get_current_epoch", input: "—", result: "current epoch 17 · latest funded epoch 10" },
  { tool: "rank_projects", input: "epoch 10", result: "#1 of 24, composite score 100 (#2 scores 75.08)" },
  { tool: "get_trust_profile", input: "epoch 10", result: "donor diversity 0.305 · whale dependency 0.458 · 38 of 52 donors repeat" },
  { tool: "simulate_mechanisms", input: "epoch 10", result: "this project: +8.9% standard · −3.1% capped · −70.0% one-person-one-vote" },
  { tool: "scan_chain", input: "address", result: "11 chains · active on 2 (Ethereum 8 txs, Optimism 4) · EOA" },
  { tool: "find_in_retropgf", input: "address", result: "not found in Optimism RetroPGF" },
  { tool: "get_oso_metrics", input: "address", result: "no Open Source Observer record" },
];

export const VERDICT = {
  call: "Hold / Investigate",
  why: "Ranked #1 by funding, but the donor base shrank from 80 to 52 while funding doubled, one donor supplies 45.8% of direct allocations, and the allocation falls 70% under one-person-one-vote. OSO and RetroPGF had nothing on it — reported as evidence gaps, not filled in.",
};

/** /api/detect-anomalies?epoch=10 */
export const EPOCH_ANOMALIES = {
  donations: 1177,
  donors: 254,
  totalEth: 14.84,
  top10Share: 96.9,
  identicalDonations: 24,
};

/** simulate_mechanisms, epoch 10: Gini of the whole round + the focus project's change */
export const MECHANISMS: { name: string; gini: number; change: number }[] = [
  { name: "Standard QF", gini: 0.396, change: 8.9 },
  { name: "Trust-weighted QF", gini: 0.372, change: 8.1 },
  { name: "Capped QF (10%)", gini: 0.363, change: -3.1 },
  { name: "One person, one vote", gini: 0.167, change: -70.0 },
];

/** scan_chain on the focus address: BNB Chain networks first, as the scanner orders them */
export const CHAINS: { name: string; id: number; txs: number }[] = [
  { name: "BNB Smart Chain", id: 56, txs: 0 },
  { name: "opBNB", id: 204, txs: 0 },
  { name: "Ethereum", id: 1, txs: 8 },
  { name: "Base", id: 8453, txs: 0 },
  { name: "Optimism", id: 10, txs: 4 },
  { name: "Arbitrum", id: 42161, txs: 0 },
  { name: "Mantle", id: 5000, txs: 0 },
  { name: "Scroll", id: 534352, txs: 0 },
  { name: "Linea", id: 59144, txs: 0 },
  { name: "zkSync Era", id: 324, txs: 0 },
  { name: "BSC Testnet", id: 97, txs: 0 },
];

/** Cross-ecosystem lookups and what they returned for the focus project */
export const CROSS_CHECKS: { source: string; status: string; found: boolean }[] = [
  { source: "Octant rounds", status: "2 epochs of history", found: true },
  { source: "Optimism RetroPGF", status: "not found", found: false },
  { source: "Open Source Observer", status: "needs a project name", found: false },
  { source: "GitHub", status: "needs owner/repo", found: false },
];

export const ATTESTATIONS = {
  address: "0x56e6472693982df91df33842f1d087f2e4308427",
  short: "0x56e6…8427",
  url: "https://testnet.bscscan.com/address/0x56e6472693982df91df33842f1d087f2e4308427#code",
};

/** The agent's tools, as the Go registry names them. */
export const TOOLS = [
  "get_current_epoch",
  "get_project_history",
  "rank_projects",
  "get_trust_profile",
  "simulate_mechanisms",
  "scan_chain",
  "get_oso_metrics",
  "get_github_signals",
  "get_forum_sentiment",
  "find_in_retropgf",
];
