// API + SSE client for the Tessera Go backend. Candidates, in order: the backend
// set at build time via NEXT_PUBLIC_API_URL (the hosted API on Railway), then
// one on the visitor's own machine at :8080. The first that answers
// /api/health is used for the rest of the session.

const LOCAL_API = "http://localhost:8080";

export const API_CANDIDATES = [
  ...new Set([process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, ""), LOCAL_API].filter((b): b is string => Boolean(b))),
];

// ngrok's free plan answers browser requests with a warning page unless this
// header is present (the backend allows it in CORS).
function headersFor(base: string): Record<string, string> {
  return /\.ngrok(-free)?\.(app|dev|io)$/.test(new URL(base).hostname) ? { "ngrok-skip-browser-warning": "1" } : {};
}

let currentBase = API_CANDIDATES[0];
let resolving: Promise<string> | null = null;

export function apiBase(): Promise<string> {
  resolving ??= (async () => {
    for (const base of API_CANDIDATES) {
      try {
        const res = await fetch(`${base}/api/health`, { headers: headersFor(base), signal: AbortSignal.timeout(4000) });
        if (res.ok) return (currentBase = base);
      } catch {
        /* unreachable — try the next candidate */
      }
    }
    return currentBase;
  })();
  return resolving;
}

async function getJSON<T>(path: string): Promise<T> {
  const base = await apiBase();
  const res = await fetch(`${base}${path}`, { headers: headersFor(base) });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* non-JSON body */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

/* ─────────────── Types (mirror the Go API) ─────────────── */

export interface AgentInfo {
  model: string;
  backends: string[];
  ready: boolean;
}

export interface ServiceStatus {
  name: string;
  status: "ok" | "error";
  detail?: string;
}
export interface StatusResponse {
  services: ServiceStatus[];
}

export interface EpochResponse {
  currentEpoch: number;
  // most recent epoch with funding data; the counter keeps advancing past it
  latestFundedEpoch?: number;
}

export interface EpochProject {
  address: string;
  allocated: number;
  matched: number;
  score: number;
  cluster: number;
  rank: number;
}
export interface AnalyzeEpochResponse {
  epoch: number;
  projects: EpochProject[];
}

export interface TrustProfile {
  address: string;
  donorCount: number;
  uniqueDonors: number;
  donorDiversity: number;
  whaleDepRatio: number;
  coordinationRisk: number;
  repeatDonors: number;
  flags: string[];
}
export interface TrustGraphResponse {
  epoch: number;
  profiles: TrustProfile[];
}

export interface MechanismProject {
  address: string;
  allocated: number;
  originalAlloc: number;
  change: number;
}
export interface Mechanism {
  name: string;
  description: string;
  giniCoeff: number;
  topShare: number;
  aboveThreshold: number;
  projects: MechanismProject[];
}
export interface SimulateResponse {
  epoch: number;
  mechanisms: Mechanism[];
}

export interface AnomalyReport {
  totalDonations: number;
  uniqueDonors: number;
  totalAmount: number;
  meanDonation: number;
  medianDonation: number;
  maxDonation: number;
  whaleConcentration: number;
  flags: string[];
}
export interface AnomaliesResponse {
  epoch: number;
  report: AnomalyReport | null;
}

export interface ReportEntry {
  name: string;
  size: number;
  modTime: string;
}
export interface ReportsResponse {
  reports: ReportEntry[];
}

/* ─────────────── JSON endpoints ─────────────── */

export const getAgentInfo = () => getJSON<AgentInfo>("/api/agent/info");
export const getStatus = () => getJSON<StatusResponse>("/api/status");
export const getCurrentEpoch = () => getJSON<EpochResponse>("/api/epochs/current");
export const analyzeEpoch = (epoch: number) =>
  getJSON<AnalyzeEpochResponse>(`/api/analyze-epoch?epoch=${epoch}`);
export const getTrustGraph = (epoch: number) =>
  getJSON<TrustGraphResponse>(`/api/trust-graph?epoch=${epoch}`);
export const getSimulation = (epoch: number) =>
  getJSON<SimulateResponse>(`/api/simulate?epoch=${epoch}`);
export const detectAnomalies = (epoch: number) =>
  getJSON<AnomaliesResponse>(`/api/detect-anomalies?epoch=${epoch}`);
export const getReports = () => getJSON<ReportsResponse>("/api/reports");

/* ─────────────── Verdict notary (BAS on BNB Chain) ─────────────── */

export interface NotaryInfo {
  enabled: boolean;
  chainId: number;
  contract: string;
  rpcUrl: string;
  schema: string;
  schemaUid: string;
  attester?: string;
  explorer: string;
}

export interface NotaryReceipt {
  uid: string;
  txHash: string;
  block: number;
  chainId: number;
  attester: string;
  schemaUid: string;
  time: string;
  attestationUrl: string;
  txUrl: string;
  reportUri: string;
  reportHash: string;
  evidenceHash: string;
  verdict: string;
}

export const getNotaryInfo = () => getJSON<NotaryInfo>("/api/notary");

/** Records a stored run's verdict on BNB Chain; returns the existing receipt if already done. */
export async function notarize(reportId: string): Promise<NotaryReceipt> {
  const base = await apiBase();
  const res = await fetch(`${base}/api/notarize?id=${encodeURIComponent(reportId)}`, { method: "POST", headers: headersFor(base) });
  if (!res.ok) {
    let detail = `${res.status}: ${res.statusText}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* non-JSON body */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<NotaryReceipt>;
}

/** A stored run file (report .md, .evidence.json) on the current backend. */
export const runFileURL = (name: string) => `${currentBase}/api/reports/${encodeURIComponent(name)}`;

/**
 * Opens a report PDF in a new tab. A plain link would hit ngrok's warning page
 * through a tunnel, so the PDF is fetched with headersFor() and shown as a blob.
 * Call it directly from a click handler: the tab opens before any await so pop-up
 * blockers allow it.
 */
export async function openReport(name: string): Promise<void> {
  const tab = window.open("", "_blank");
  const base = await apiBase();
  const res = await fetch(`${base}/api/reports/${encodeURIComponent(name)}`, { headers: headersFor(base) });
  if (!res.ok) {
    tab?.close();
    throw new Error(`${res.status}: ${res.statusText}`);
  }
  const url = URL.createObjectURL(await res.blob());
  if (tab) tab.location.href = url;
  else window.location.href = url;
}

/* ─────────────── Agent SSE stream ─────────────── */

export interface AgentEvent {
  type: "text" | "tool_call" | "tool_result" | "done" | "error" | "result";
  text?: string;
  tool?: string;
  input?: unknown;
  result?: string;
  isError?: boolean;
  // emitted on the final "result" event
  report?: string;
  reportPath?: string;
  reportId?: string; // the stored run, for notarisation
  reportHash?: string; // keccak256 of report
  verdict?: string; // FUND | HOLD | REJECT | UNSPECIFIED
  error?: string;
}

export interface AgentHandlers {
  onEvent: (event: AgentEvent) => void;
  onError?: (message: string) => void;
}

const AGENT_EVENT_NAMES: AgentEvent["type"][] = [
  "text",
  "tool_call",
  "tool_result",
  "done",
  "error",
  "result",
];

/**
 * Opens an SSE stream to an agent endpoint and dispatches typed events.
 * Returns a function that closes the stream. Uses fetch rather than
 * EventSource so it can send headers (see headersFor) and surface the
 * backend's own error message when the run is refused (e.g. 503, 429).
 */
export function streamAgent(
  path: string,
  params: Record<string, string | undefined>,
  handlers: AgentHandlers,
): () => void {
  const ctrl = new AbortController();
  let finished = false;
  const finish = (event?: AgentEvent) => {
    finished = true;
    if (event) handlers.onEvent(event);
    ctrl.abort();
  };

  (async () => {
    const base = await apiBase();
    const url = new URL(`${base}${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
    const res = await fetch(url, {
      headers: { Accept: "text/event-stream", ...headersFor(base) },
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) {
      let message = `${res.status}: ${res.statusText}`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        /* non-JSON body */
      }
      return finish({ type: "error", error: message });
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value.replace(/\r\n/g, "\n");
      let end: number;
      while ((end = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, end);
        buf = buf.slice(end + 2);
        let name = "";
        let data = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) name = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        const type = name as AgentEvent["type"];
        if (!AGENT_EVENT_NAMES.includes(type)) continue;
        let event: AgentEvent = { type };
        try {
          event = { ...(JSON.parse(data) as AgentEvent), type };
        } catch {
          /* keep bare event */
        }
        if (type === "result" || type === "error") return finish(event);
        handlers.onEvent(event);
      }
    }
    if (!finished) handlers.onError?.("connection to agent lost");
  })().catch(() => {
    if (!finished && !ctrl.signal.aborted) handlers.onError?.("connection to agent lost");
  });

  return () => finish();
}
