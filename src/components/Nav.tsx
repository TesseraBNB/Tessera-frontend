"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Logo from "./Logo";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { getAgentInfo, type AgentInfo } from "@/lib/api";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/#evidence", label: "Evidence" },
  { href: "/#method", label: "Method" },
  { href: "/dashboard", label: "Console" },
];

export default function Nav() {
  const pathname = usePathname();
  const [info, setInfo] = useState<AgentInfo | null | undefined>(undefined);

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
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-night/80 py-2 pr-2 pl-5">
        <Link href="/" aria-label="Tessera home" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 text-[0.85rem] font-medium transition-colors ${
                  active ? "bg-white/[0.07] text-ink" : "text-ink-dim hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <AgentPill info={info} />
          <LiquidMetalButton
            href="https://github.com/TesseraBNB"
            external
            size="sm"
            label="GitHub"
            icon={<ArrowUpRight size={14} />}
            className="hidden! sm:inline-flex!"
          />
          {pathname !== "/dashboard" && <LiquidMetalButton href="/dashboard" variant="primary" size="sm" label="Console" />}
        </div>
      </div>
    </header>
  );
}

// undefined = still checking, null = backend unreachable
function AgentPill({ info }: { info: AgentInfo | null | undefined }) {
  const ready = info?.ready ?? false;
  const label = info === undefined ? "checking" : info ? info.model.replace("claude-", "") || "agent" : "offline";
  return (
    <span
      className="hidden max-w-[15rem] items-center gap-2 rounded-full border border-line-bright/70 px-3 py-1.5 lg:inline-flex"
      title={info ? `Agent backends: ${info.backends.join(", ") || "none"}` : "Tessera backend not reachable"}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          ready ? "animate-pulse-soft bg-good" : info === undefined ? "bg-ink-faint" : "bg-bad"
        }`}
        aria-hidden
      />
      <span className="truncate font-mono text-[0.68rem] text-ink-dim">{label}</span>
    </span>
  );
}
