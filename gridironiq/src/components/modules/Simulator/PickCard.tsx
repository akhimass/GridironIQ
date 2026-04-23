import { PosBadge } from "@/components/shared/PosBadge";
import type { TeamRow } from "@/data/teams";

export function PickCard({ team, onSelect }: { team: TeamRow; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3 text-left transition-colors duration-150 ease hover:border-giq-gold/40"
    >
      <div className="font-mono text-xl text-giq-gold">{team.abbr}</div>
      <div className="font-body text-[11px] text-giq-text2">{team.name}</div>
      <div className="mt-2 inline-block rounded-[2px] bg-giq-goldDim px-2 py-0.5 font-mono text-[9px] text-giq-gold">
        Pick #{team.pickNumber}
      </div>
      <div className="mt-2 flex gap-1">
        <PosBadge pos={team.needs[0]} />
        <PosBadge pos={team.needs[1]} />
      </div>
    </button>
  );
}
