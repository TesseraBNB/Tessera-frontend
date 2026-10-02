"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleCheck, CircleX, LoaderCircle, ShieldCheck, Stamp } from "lucide-react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { getNotaryInfo, notarize, runFileURL, type NotaryInfo, type NotaryReceipt } from "@/lib/api";
import { hashText, readVerdict, shortHex, type OnchainVerdict } from "@/lib/attestation";

const VERDICT_TONE: Record<string, string> = {
  FUND: "border-good/50 bg-good/10 text-good",
  HOLD: "border-warn/50 bg-warn/10 text-warn",
  REJECT: "border-bad/50 bg-bad/10 text-bad",
};

export function VerdictPill({ verdict }: { verdict?: string }) {
  const v = verdict || "UNSPECIFIED";
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 font-mono text-[0.7rem] tracking-wider ${VERDICT_TONE[v] ?? "border-line-bright text-ink-faint"}`}>
      {v}
    </span>
  );
}

type Check = { ok: boolean; onchain: OnchainVerdict; local: string } | { error: string };

/**
 * Records a finished run's verdict on BNB Chain (a BAS attestation holding the
 * report's and evidence's keccak256 hashes) and lets the reader check the
 * report against it — the check reads the chain directly from the browser.
 */
export default function NotaryPanel({
  reportId,
  report,
  verdict,
}: {
  reportId: string;
  report: string;
  verdict?: string;
}) {
  const [info, setInfo] = useState<NotaryInfo | null>(null);
  const [receipt, setReceipt] = useState<NotaryReceipt>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [check, setCheck] = useState<Check>();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getNotaryInfo()
      .then(setInfo)
      .catch(() => setInfo({ enabled: false } as NotaryInfo));
  }, []);

  const record = async () => {
    setBusy(true);
    setError(undefined);
    try {
      setReceipt(await notarize(reportId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "notarisation failed");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!receipt) return;
    setChecking(true);
    try {
      const onchain = await readVerdict(receipt.uid as `0x${string}`);
      const local = hashText(report);
      setCheck({ ok: local.toLowerCase() === onchain.reportHash.toLowerCase(), onchain, local });
    } catch (e) {
      setCheck({ error: e instanceof Error ? e.message : "could not read the attestation" });
    } finally {
      setChecking(false);
    }
  };

  if (!info) return null;

  return (
    <div className="glass p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow flex items-center gap-2">
          <Stamp size={13} /> On-chain notary · BNB Chain
        </p>
        <VerdictPill verdict={receipt?.verdict ?? verdict} />
      </div>

      {!info.enabled ? (
        <p className="mt-3 text-[0.85rem] text-ink-faint">
          This backend has no notary key, so verdicts cannot be recorded on BNB Chain from here.
        </p>
      ) : !receipt ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[0.88rem] leading-relaxed text-ink-dim">
            Record this verdict as a BNB Attestation Service entry on BSC testnet: the keccak256 of this exact report and
            of every tool result behind it, signed by Tessera&apos;s notary. Anyone can then prove the report was not
            changed.
          </p>
          <LiquidMetalButton
            variant="primary"
            disabled={busy}
            label={busy ? "Writing to BSC…" : "Notarize on BNB Chain"}
            iconStart
            icon={busy ? <LoaderCircle size={15} className="animate-spin" /> : <Stamp size={15} />}
            onClick={record}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="flex items-center gap-2 text-[0.92rem] font-semibold text-good">
            <CircleCheck size={17} /> Notarized on BNB Chain · {new Date(receipt.time).toUTCString().replace("GMT", "UTC")}
          </p>
          <dl className="grid gap-x-6 gap-y-2 font-mono text-[0.74rem] sm:grid-cols-[9rem_1fr]">
            <Row label="Attestation">
              <a href={receipt.attestationUrl} target="_blank" rel="noopener noreferrer" className="link-grow inline-flex items-center gap-1 text-cyan">
                {shortHex(receipt.uid, 10)} <ArrowUpRight size={12} />
              </a>
            </Row>
            <Row label="Transaction">
              <a href={receipt.txUrl} target="_blank" rel="noopener noreferrer" className="link-grow inline-flex items-center gap-1 text-cyan">
                {shortHex(receipt.txHash, 10)} <ArrowUpRight size={12} />
              </a>{" "}
              <span className="text-ink-faint">block {receipt.block.toLocaleString()} · chain {receipt.chainId}</span>
            </Row>
            <Row label="Report hash">{shortHex(receipt.reportHash, 10)}</Row>
            <Row label="Evidence hash">
              {shortHex(receipt.evidenceHash, 10)}{" "}
              <a href={runFileURL(`${reportId}.evidence.json`)} target="_blank" rel="noopener noreferrer" className="link-grow text-ink-faint">
                (evidence file)
              </a>
            </Row>
          </dl>

          <div className="flex flex-wrap items-center gap-3">
            <LiquidMetalButton
              label={checking ? "Reading BSC…" : "Verify against chain"}
              iconStart
              icon={checking ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              disabled={checking}
              onClick={verify}
            />
            <Link href={`/verify?uid=${receipt.uid}`} className="link-grow text-[0.82rem] text-ink-dim">
              public verify page
            </Link>
          </div>

          {check && <CheckResult check={check} />}
        </div>
      )}

      {error && (
        <p className="mt-3 font-mono text-[0.78rem] text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-faint">{label}</dt>
      <dd className="break-all text-ink-dim">{children}</dd>
    </>
  );
}

export function CheckResult({ check }: { check: Check }) {
  if ("error" in check) {
    return <p className="font-mono text-[0.78rem] text-bad">{check.error}</p>;
  }
  const { ok, onchain, local } = check;
  return (
    <div className={`rounded-2xl border p-4 ${ok ? "border-good/40 bg-good/5" : "border-bad/40 bg-bad/5"}`}>
      <p className={`flex items-center gap-2 font-semibold ${ok ? "text-good" : "text-bad"}`}>
        {ok ? <CircleCheck size={17} /> : <CircleX size={17} />}
        {ok
          ? `Matches the attestation — unchanged since ${onchain.time.toUTCString().replace("GMT", "UTC")}`
          : "Does not match the attestation — this text is not the report that was notarised"}
      </p>
      <p className="mt-2 font-mono text-[0.72rem] break-all text-ink-faint">
        on chain {onchain.reportHash}
        <br />
        this text {local}
      </p>
    </div>
  );
}
