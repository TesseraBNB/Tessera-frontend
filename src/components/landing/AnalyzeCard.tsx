"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import BorderGlow from "@/components/reactbits/BorderGlow";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { FOCUS } from "@/lib/showcase";

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

const OUTPUTS = [
  "Funding history & rank",
  "Donor trust profile",
  "Four-mechanism replay",
  "11-chain scan",
  "Verdict + PDF report",
];

/** The landing's "calculator": paste an Octant address, open the console with it filled in. */
export default function AnalyzeCard() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const valid = ADDRESS.test(address.trim());

  const go = () => valid && router.push(`/dashboard?address=${address.trim()}`);

  return (
    <BorderGlow
      backgroundColor="#0e0c18"
      borderRadius={28}
      glowColor="270 95 75"
      colors={["#9c43fe", "#4cc2e9", "#5a1fb0"]}
      glowIntensity={0.9}
      animated
      className="w-full"
    >
      <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="eyebrow">Analyze a project</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Paste an Octant address.</h2>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-dim">
            The agent pulls its funding history, donor graph, mechanism sensitivity and on-chain footprint,
            then writes a verdict.
          </p>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
          >
            <label className="sr-only" htmlFor="landing-address">Octant project address</label>
            <input
              id="landing-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              autoComplete="off"
              className="field"
            />
            <LiquidMetalButton type="submit" variant="primary" disabled={!valid} label="Analyze" icon={<ArrowRight size={16} strokeWidth={2.4} />} />
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8rem] text-ink-faint">
            <button
              type="button"
              onClick={() => setAddress(FOCUS.address)}
              className="link-grow font-mono text-cyan"
            >
              try {FOCUS.name} · {FOCUS.short}
            </button>
            <Link href="/dashboard?mode=evaluate" className="link-grow">evaluate a proposal instead</Link>
            <Link href="/dashboard?mode=explore" className="link-grow">explore an epoch</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-void/60 p-5">
          <p className="eyebrow">You get</p>
          <ul className="mt-4 space-y-3">
            {OUTPUTS.map((o, i) => (
              <li key={o} className="flex items-center gap-3 text-[0.88rem] text-ink-dim">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet/15 font-mono text-[0.66rem] text-violet-bright">
                  {i + 1}
                </span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BorderGlow>
  );
}
