"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { getAgentInfo, type AgentInfo } from "@/lib/api";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();
  const [info, setInfo] = useState<AgentInfo | null>(null);

  useEffect(() => {
    let live = true;
    getAgentInfo()
      .then((i) => live && setInfo(i))
      .catch(() => live && setInfo(null));
    return () => {
      live = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" aria-label="Tessera home" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1.5">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 font-mono text-[0.8rem] tracking-wide transition-colors ${
                  active ? "bg-raised text-bone" : "text-bone-dim hover:text-bone"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <AgentPill info={info} />
        </nav>
      </div>
    </header>
  );
}

function AgentPill({ info }: { info: AgentInfo | null }) {
  const ready = info?.ready ?? false;
  return (
    <span
      className="ml-1 hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 sm:inline-flex"
      title={info ? `Backends: ${info.backends.join(", ") || "none"}` : "Agent status unknown"}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-signal pulse-soft" : "bg-bad"}`}
        aria-hidden
      />
      <span className="font-mono text-[0.7rem] tracking-wide text-bone-dim">
        {info ? (info.model.replace("claude-", "") || "agent") : "offline"}
      </span>
    </span>
  );
}
