import { Fragment, type ReactNode } from "react";

/**
 * A small, dependency-free Markdown renderer tuned for the agent's reports:
 * headings, bold/italic/code inline, bullet & ordered lists, blockquotes,
 * horizontal rules, fenced code, and pipe tables. Not a full CommonMark parser,
 * but faithful to what the agent emits.
 */
export default function Prose({ markdown }: { markdown: string }) {
  return <div className="prose-tessera">{renderBlocks(markdown)}</div>;
}

function inline(text: string, keyBase: string): ReactNode[] {
  // Split on **bold**, *italic*, and `code`, keeping delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    const key = `${keyBase}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(p))
      return <strong key={key} className="font-semibold text-bone">{p.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(p))
      return <em key={key} className="italic text-bone">{p.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(p))
      return (
        <code key={key} className="rounded bg-void px-1.5 py-0.5 font-mono text-[0.85em] text-signal">
          {p.slice(1, -1)}
        </code>
      );
    return <Fragment key={key}>{p}</Fragment>;
  });
}

function renderBlocks(md: string): ReactNode[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const next = () => key++;

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (line.trim() === "") { i++; continue; }

    // fenced code
    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
      i++; // closing fence
      out.push(
        <pre key={next()} className="my-4 overflow-x-auto rounded-lg border border-line bg-void p-4 font-mono text-[0.8rem] text-bone-dim">
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(<hr key={next()} className="my-6 border-line" />);
      i++;
      continue;
    }

    // headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls = [
        "mt-7 mb-3 font-display text-3xl text-bone",
        "mt-7 mb-3 font-display text-2xl text-bone",
        "mt-6 mb-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-signal",
        "mt-5 mb-2 font-semibold text-bone",
      ][level - 1];
      const content = inline(h[2], `h${next()}`);
      out.push(
        level <= 2 ? (
          <h2 key={next()} className={cls}>{content}</h2>
        ) : level === 3 ? (
          <h3 key={next()} className={cls}>{content}</h3>
        ) : (
          <h4 key={next()} className={cls}>{content}</h4>
        ),
      );
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(
        <blockquote key={next()} className="my-4 border-l-2 border-ember pl-4 text-bone-dim italic">
          {inline(buf.join(" "), `bq${key}`)}
        </blockquote>,
      );
      continue;
    }

    // table (pipe)
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") rows.push(splitRow(lines[i++]));
      out.push(
        <div key={next()} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line-bright">
                {header.map((c, j) => (
                  <th key={j} className="px-3 py-2 text-left font-mono text-[0.7rem] uppercase tracking-wider text-bone-dim">
                    {inline(c, `th${key}-${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-line/60">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 font-mono text-[0.82rem] text-bone">{inline(c, `td${key}-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      out.push(
        <ul key={next()} className="my-3 space-y-1.5 pl-1">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2.5 text-bone-dim">
              <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-ember" aria-hidden />
              <span>{inline(it, `li${key}-${j}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      out.push(
        <ol key={next()} className="my-3 space-y-1.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2.5 text-bone-dim">
              <span className="font-mono text-xs text-signal">{String(j + 1).padStart(2, "0")}</span>
              <span>{inline(it, `ol${key}-${j}`)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // paragraph (gather until blank)
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,4}\s|>|\s*[-*]\s|\s*\d+\.\s|```)/.test(lines[i])) {
      buf.push(lines[i++]);
    }
    out.push(
      <p key={next()} className="my-3 leading-relaxed text-bone-dim">{inline(buf.join(" "), `p${key}`)}</p>,
    );
  }

  return out;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}
