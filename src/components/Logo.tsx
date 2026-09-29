interface LogoProps {
  size?: number;
  wordmark?: boolean;
  className?: string;
}

/** The Tessera mosaic mark: four tessellated diamonds forming a larger tile. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <polygon points="32,9 43,20 32,31 21,20" fill="var(--color-ember)" />
      <polygon points="44,21 55,32 44,43 33,32" fill="var(--color-signal)" />
      <polygon points="32,33 43,44 32,55 21,44" fill="var(--color-bone)" />
      <polygon points="20,21 31,32 20,43 9,32" fill="var(--color-bone-dim)" />
    </svg>
  );
}

export default function Logo({ size = 28, wordmark = true, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="font-display text-[1.35rem] leading-none tracking-tight text-bone">
          Tessera
        </span>
      )}
    </span>
  );
}
