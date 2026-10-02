// Reads Tessera verdicts straight from BNB Chain and checks reports against
// them, in the browser. Nothing here goes through the Tessera backend: the
// attestation comes from a public BSC testnet RPC and the hash is computed
// locally, so the check holds even if the backend were wrong.

import { createPublicClient, decodeAbiParameters, http, keccak256, parseAbiParameters, toBytes, type Hex } from "viem";
import { bscTestnet } from "viem/chains";

export const BAS = {
  contract: "0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD", // BAS (EAS v1.3.0) on BSC testnet
  chainId: 97,
  rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
  explorer: "https://www.testnet.bascan.io",
  txExplorer: "https://testnet.bscscan.com",
  // registered by `tessera notary-setup`
  schemaUid: "0xcd4d38906641353fefefe1caabcba23f730b0512039c1b3c5478d47cf97373f8",
  // Tessera's own TesseraAttestations contract: holds the same report hash
  registry: "0x56e6472693982df91df33842f1d087f2e4308427",
} as const;

const RISK = ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] as const;

const registryAbi = [
  {
    type: "function",
    name: "getAttestation",
    stateMutability: "view",
    inputs: [{ name: "verdictHash", type: "bytes32" }],
    outputs: [
      { name: "exists", type: "bool" },
      {
        name: "attestation",
        type: "tuple",
        components: [
          { name: "committer", type: "address" },
          { name: "committedAt", type: "uint64" },
          { name: "riskLevel", type: "uint8" },
          { name: "projectId", type: "string" },
          { name: "evidenceUri", type: "string" },
        ],
      },
    ],
  },
] as const;

const SCHEMA = parseAbiParameters(
  "address project, string subject, string kind, string verdict, bytes32 reportHash, bytes32 evidenceHash, string reportURI, string agent",
);

const easAbi = [
  {
    type: "function",
    name: "getAttestation",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "schema", type: "bytes32" },
          { name: "time", type: "uint64" },
          { name: "expirationTime", type: "uint64" },
          { name: "revocationTime", type: "uint64" },
          { name: "refUID", type: "bytes32" },
          { name: "recipient", type: "address" },
          { name: "attester", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
  },
] as const;

const client = createPublicClient({ chain: bscTestnet, transport: http(BAS.rpcUrl) });

export interface OnchainVerdict {
  uid: Hex;
  time: Date;
  attester: string;
  recipient: string;
  revoked: boolean;
  project: string;
  subject: string;
  kind: string;
  verdict: string;
  reportHash: Hex;
  evidenceHash: Hex;
  reportURI: string;
  agent: string;
}

export const isUID = (s: string): s is Hex => /^0x[0-9a-fA-F]{64}$/.test(s.trim());

/** Reads one Tessera verdict attestation from BSC testnet. */
export async function readVerdict(uid: Hex): Promise<OnchainVerdict> {
  const a = await client.readContract({ address: BAS.contract, abi: easAbi, functionName: "getAttestation", args: [uid] });
  if (/^0x0+$/.test(a.uid)) throw new Error("No attestation with this UID on BSC testnet.");
  if (a.schema.toLowerCase() !== BAS.schemaUid) throw new Error("This attestation exists but is not a Tessera verdict.");
  const [project, subject, kind, verdict, reportHash, evidenceHash, reportURI, agent] = decodeAbiParameters(SCHEMA, a.data);
  return {
    uid,
    time: new Date(Number(a.time) * 1000),
    attester: a.attester,
    recipient: a.recipient,
    revoked: a.revocationTime > BigInt(0),
    project,
    subject,
    kind,
    verdict,
    reportHash,
    evidenceHash,
    reportURI,
    agent,
  };
}

export interface RegistryRecord {
  committer: string;
  committedAt: Date;
  riskLevel: (typeof RISK)[number];
  projectId: string;
  evidenceUri: string;
}

/** The TesseraAttestations record for a report hash, or null when it holds none. */
export async function readRegistry(reportHash: Hex): Promise<RegistryRecord | null> {
  const [exists, a] = await client.readContract({ address: BAS.registry, abi: registryAbi, functionName: "getAttestation", args: [reportHash] });
  if (!exists) return null;
  return {
    committer: a.committer,
    committedAt: new Date(Number(a.committedAt) * 1000),
    riskLevel: RISK[a.riskLevel] ?? "UNKNOWN",
    projectId: a.projectId,
    evidenceUri: a.evidenceUri,
  };
}

/** keccak256 of the UTF-8 bytes of a text, the hash the notary attests. */
export const hashText = (text: string): Hex => keccak256(toBytes(text));

export const shortHex = (h: string, n = 6) => (h.length > 2 * n + 2 ? `${h.slice(0, n + 2)}…${h.slice(-n)}` : h);
