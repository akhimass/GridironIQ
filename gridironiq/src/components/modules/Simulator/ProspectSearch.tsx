import { PosBadge } from "@/components/shared/PosBadge";
import { RankBadge } from "@/components/shared/RankBadge";
import { ScoreBar } from "@/components/shared/ScoreBar";
import type { Prospect } from "@/data/prospects";
import { posMatchesNeed } from "@/lib/utils";

export function ProspectSearch({
  searchQuery,
  onSearchChange,
  results,
  needTop,
  onPick,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  results: Prospect[];
  needTop?: string;
  onPick: (p: Prospect) => void;
}) {
  return (
    <>
      <input
        autoFocus
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="SEARCH prospects..."
        className="mb-2 w-full rounded-[2px] border border-white/[0.06] bg-giq-ink3 px-2 py-2 font-mono text-[11px]"
      />
      <div className="max-h-[50vh] space-y-1 overflow-auto">
        {results.map((p) => {
          const match = needTop && posMatchesNeed(p.pos, needTop);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className={`flex w-full items-center gap-2 rounded-[2px] border border-white/[0.06] p-2 text-left transition-colors duration-150 ease hover:bg-giq-ink3 ${
                match ? "border-l-2 border-l-giq-green" : ""
              }`}
            >
              <RankBadge rank={p.rank} />
              <div className="flex-1">
                <div className="font-body text-sm font-semibold">{p.name}</div>
                <div className="flex items-center gap-2">
                  <PosBadge pos={p.pos} />
                  <span className="font-mono text-[9px] text-giq-text3">{p.school}</span>
                </div>
              </div>
              <ScoreBar score={p.giqScore} maxWidth={40} />
            </button>
          );
        })}
      </div>
    </>
  );
}
