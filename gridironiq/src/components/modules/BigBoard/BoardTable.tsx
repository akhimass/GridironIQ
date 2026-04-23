import type { Prospect } from "@/data/prospects";
import { SISCitation } from "@/components/shared/SISCitation";
import { BoardRow } from "./BoardRow";

export function BoardTable({
  rows,
  onSelect,
  onOpenCompare,
}: {
  rows: Prospect[];
  onSelect: (p: Prospect) => void;
  onOpenCompare?: (p: Prospect) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.06] font-mono text-[9px] uppercase tracking-wide text-giq-text3">
            <th className="py-2 pl-3">#</th>
            <th className="py-2">PLAYER</th>
            <th className="py-2">POS</th>
            <th className="py-2">SCHOOL</th>
            <th className="py-2">CONF</th>
            <th className="py-2">GIQ_SCORE</th>
            <th className="py-2">40_YD</th>
            <th className="py-2">SIS_GRADE</th>
            <th className="py-2">INJ_RISK</th>
            <th className="py-2">R1_PROB</th>
            <th className="py-2">TREND</th>
            {onOpenCompare ? <th className="py-2">CMP</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <BoardRow
              key={p.id}
              p={p}
              onClick={() => onSelect(p)}
              onOpenCompare={onOpenCompare ? () => onOpenCompare(p) : undefined}
            />
          ))}
        </tbody>
      </table>
      <div className="px-2 py-2">
        <SISCitation />
      </div>
    </div>
  );
}
