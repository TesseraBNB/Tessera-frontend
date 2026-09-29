// API + SSE client for the Tessera Go backend (Railway). The base URL is
// configured at build time via NEXT_PUBLIC_API_URL; in local dev it defaults
// to the Go server on :8080.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
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
export const reportURL = (name: string) =>
  `${API_BASE}/api/reports/${encodeURIComponent(name)}`;

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
 * Returns a function that closes the stream.
 */
export function streamAgent(
  path: string,
  params: Record<string, string | undefined>,
  handlers: AgentHandlers,
): () => void {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const es = new EventSource(url.toString());
  let finished = false;

  for (const name of AGENT_EVENT_NAMES) {
    es.addEventListener(name, (e) => {
      let data: AgentEvent = { type: name };
      try {
        data = { ...(JSON.parse((e as MessageEvent).data) as AgentEvent), type: name };
      } catch {
        /* keep bare event */
      }
      handlers.onEvent(data);
      if (name === "result" || name === "error") {
        finished = true;
        es.close();
      }
    });
  }

  es.onerror = () => {
    // EventSource fires onerror on normal close too; only surface if we never finished.
    if (!finished) {
      handlers.onError?.("connection to agent lost");
      es.close();
    }
  };

  return () => {
    finished = true;
    es.close();
  };
}
