import { cn } from "@/lib/utils";

export function CompareRow({
  label,
  a,
  b,
  aWin,
  bWin,
  fmt = (v: number | string) => String(v),
}: {
  label: string;
  a: number | string;
  b: number | string;
  aWin: boolean;
  bWin: boolean;
  fmt?: (v: number | string) => string;
}) {
  const na = typeof a === "number" ? a : 0;
  const nb = typeof b === "number" ? b : 0;
  const max = typeof a === "number" && typeof b === "number" ? Math.max(na, nb, 1) : 100;
  const wa = typeof a === "number" ? (na / max) * 100 : aWin ? 70 : 30;
  const wb = typeof b === "number" ? (nb / max) * 100 : bWin ? 70 : 30;

  return (
    <div className="grid grid-cols-[1fr_120px_40px_120px] items-center gap-2 border-b border-white/[0.03] py-2 font-mono text-[10px]">
      <div className="text-center text-giq-text3">{label}</div>
      <div className={cn("text-right font-body font-semibold", aWin && "text-giq-gold2")}>{fmt(a)}</div>
      <div className="flex flex-col gap-1">
        <div className="h-1 w-full bg-giq-ink3">
          <div className="h-full bg-giq-gold/40" style={{ width: `${wa}%` }} />
        </div>
        <div className="h-1 w-full bg-giq-ink3">
          <div className="h-full bg-giq-cyan/40" style={{ width: `${wb}%` }} />
        </div>
      </div>
      <div className={cn("text-left font-body font-semibold", bWin && "text-giq-gold2")}>{fmt(b)}</div>
    </div>
  );
}
