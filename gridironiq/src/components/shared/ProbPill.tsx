import { cn } from "@/lib/utils";

export function ProbPill({ prob }: { prob: number }) {
  const tier = prob >= 0.7 ? "high" : prob >= 0.4 ? "med" : "low";
  return (
    <span
      className={cn(
        "inline-block rounded-[2px] border px-2 py-[2px] font-mono text-[10px] font-bold",
        tier === "high" && "border-giq-green/50 bg-giq-green/10 text-giq-green",
        tier === "med" && "border-giq-gold/50 bg-giq-goldDim text-giq-gold",
        tier === "low" && "border-white/[0.06] bg-transparent text-giq-text3"
      )}
    >
      {Math.round(prob * 100)}%
    </span>
  );
}
