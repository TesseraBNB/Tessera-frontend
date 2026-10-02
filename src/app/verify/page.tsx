"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, LoaderCircle, ShieldCheck } from "lucide-react";
import Nav from "@/components/Nav";
import { CheckResult, VerdictPill } from "@/components/NotaryPanel";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { BAS, hashText, isUID, readVerdict, shortHex, type OnchainVerdict } from "@/lib/attestation";

type Check = { ok: boolean; onchain: OnchainVerdict; local: string } | { error: string };

export default function VerifyPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="sky pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative">
        <Nav />
        <main className="mx-auto max-w-4xl px-5 pt-10 pb-20">
          <header className="mb-8">
            <p className="eyebrow">Public verification</p>
            <h1 className="mt-2 text-4xl font-semibold text-ink">Verify a Tessera verdict</h1>
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-dim">
              Every notarised verdict is a BNB Attestation Service entry on BSC testnet holding the keccak256 of its report
              and evidence. This page reads it straight from the chain and hashes the report in your browser — the Tessera
              backend is not trusted for either step.
            </p>
          </header>
          <Suspense fallback={<div className="skeleton h-40" />}>
            <Verifier />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Verifier() {
  const params = useSearchParams();
  const [uid, setUid] = useState(params.get("uid") ?? "");
  const [loading, setLoading] = useState(false);
  const [att, setAtt] = useState<OnchainVerdict>();
  const [error, setError] = useState<string>();
  const [fileCheck, setFileCheck] = useState<Check>();
  const [text, setText] = useState("");
  const [textCheck, setTextCheck] = useState<Check>();

  const lookup = useCallback(async (value: string) => {
    if (!isUID(value)) {
      setError("An attestation UID is 0x followed by 64 hex characters.");
      return;
    }
    setLoading(true);
    setError(undefined);
    setAtt(undefined);
    setFileCheck(undefined);
    setTextCheck(undefined);
    try {
      const onchain = await readVerdict(value.trim() as `0x${string}`);
      setAtt(onchain);
      if (/^https?:\/\//.test(onchain.reportURI)) {
        try {
          const res = await fetch(onchain.reportURI);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = await res.text();
          setFileCheck({ ok: hashText(body) === onchain.reportHash.toLowerCase(), onchain, local: hashText(body) });
        } catch (e) {
          setFileCheck({ error: `The report file at its attested link could not be fetched (${e instanceof Error ? e.message : "error"}). Paste the report text below to check it.` });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not read the attestation");
    } finally {
      setLoading(false);
    }
  }, []);

  // a ?uid= link opens straight onto its result
  useEffect(() => {
    const initial = params.get("uid");
    if (initial && isUID(initial)) void lookup(initial);
  }, [params, lookup]);

  return (
    <div className="space-y-6">
      <form
        className="glass-strong flex flex-col gap-3 p-6 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(uid);
        }}
      >
        <label className="block flex-1">
          <span className="eyebrow mb-2 block">Attestation UID</span>
          <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="0x…" spellCheck={false} autoComplete="off" className="field" />
        </label>
        <LiquidMetalButton
          type="submit"
          variant="primary"
          disabled={loading}
          label={loading ? "Reading BSC…" : "Verify"}
          iconStart
          icon={loading ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
        />
      </form>

      {error && (
        <p className="font-mono text-[0.8rem] text-bad" role="alert">
          {error}
        </p>
      )}

      {att && (
        <div className="glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">Attestation on BSC testnet</p>
            <VerdictPill verdict={att.verdict} />
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 font-mono text-[0.76rem] sm:grid-cols-[9rem_1fr]">
            <dt className="text-ink-faint">Subject</dt>
            <dd className="break-all text-ink">{att.subject}</dd>
            <dt className="text-ink-faint">Kind</dt>
            <dd className="text-ink-dim">{att.kind}</dd>
            {!/^0x0+$/.test(att.project) && (
              <>
                <dt className="text-ink-faint">Project</dt>
                <dd>
                  <a href={`${BAS.txExplorer}/address/${att.project}`} target="_blank" rel="noopener noreferrer" className="link-grow break-all text-cyan">
                    {att.project}
                  </a>
                </dd>
              </>
            )}
            <dt className="text-ink-faint">Attested</dt>
            <dd className="text-ink-dim">{att.time.toUTCString().replace("GMT", "UTC")}</dd>
            <dt className="text-ink-faint">Attester</dt>
            <dd className="break-all text-ink-dim">{att.attester}</dd>
            <dt className="text-ink-faint">Agent</dt>
            <dd className="text-ink-dim">{att.agent}</dd>
            <dt className="text-ink-faint">Report hash</dt>
            <dd className="break-all text-ink-dim">{att.reportHash}</dd>
            <dt className="text-ink-faint">Evidence hash</dt>
            <dd className="break-all text-ink-dim">{att.evidenceHash}</dd>
            <dt className="text-ink-faint">Report</dt>
            <dd className="break-all text-ink-dim">{att.reportURI}</dd>
          </dl>
          <a
            href={`${BAS.explorer}/attestation/${att.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-grow mt-4 inline-flex items-center gap-1 text-[0.82rem] text-cyan"
          >
            View {shortHex(att.uid, 8)} on BASScan <ArrowUpRight size={13} />
          </a>
          {att.revoked && <p className="mt-3 font-semibold text-bad">This attestation has been revoked.</p>}
          {fileCheck && (
            <div className="mt-5">
              <p className="eyebrow mb-2">Report file at its attested link</p>
              <CheckResult check={fileCheck} />
            </div>
          )}
        </div>
      )}

      {att && (
        <form
          className="glass p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const local = hashText(text);
            setTextCheck({ ok: local === att.reportHash.toLowerCase(), onchain: att, local });
          }}
        >
          <p className="eyebrow mb-2">Or check any text</p>
          <p className="mb-3 text-[0.85rem] text-ink-dim">
            Paste a report exactly as you received it (the Markdown). A single changed character gives a different hash.
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="field resize-y" placeholder="# Report…" />
          <div className="mt-3">
            <LiquidMetalButton type="submit" label="Check text" iconStart icon={<ShieldCheck size={15} />} disabled={!text} />
          </div>
          {textCheck && (
            <div className="mt-4">
              <CheckResult check={textCheck} />
            </div>
          )}
        </form>
      )}
    </div>
  );
}
