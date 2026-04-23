import { cn } from "@/lib/utils";

export function RankBadge({ rank }: { rank: number }) {
  const tier =
    rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "plain";
  return (
    <div
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-[2px] border font-mono text-[11px] font-bold",
        tier === "gold" && "border-giq-gold bg-giq-goldDim text-giq-gold",
        tier === "silver" && "border-white/30 bg-white/5 text-giq-text",
        tier === "bronze" && "border-amber-700/60 bg-amber-900/20 text-amber-200",
        tier === "plain" && "border-white/[0.06] text-giq-text2"
      )}
    >
      {rank}
    </div>
  );
}
