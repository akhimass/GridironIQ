import { PosBadge } from "@/components/shared/PosBadge";
import { ProbPill } from "@/components/shared/ProbPill";
import { RankBadge } from "@/components/shared/RankBadge";
import { ScoreBar } from "@/components/shared/ScoreBar";
import type { Prospect } from "@/data/prospects";
import { cn } from "@/lib/utils";

function trend(p: Prospect) {
  if (p.r1Prob >= 0.9) return { t: "▲ LOCK", c: "#3ecf7a" };
  if (p.r1Prob >= 0.7) return { t: "▲ HIGH", c: "#3ecf7a" };
  if (p.r1Prob >= 0.5) return { t: "→ MED", c: "#d4a843" };
  return { t: "▼ LOW", c: "#e05252" };
}

function sisGradeColor(g: number) {
  if (g >= 8.0) return "#f97316";
  if (g >= 7.0) return "#f59e0b";
  if (g >= 6.6) return "#d4a843";
  if (g >= 6.0) return "#c9a84a";
  return "#94a3b8";
}

function InjRiskCell({ risk }: { risk: Prospect["injuryRisk"] }) {
  if (risk === "Low")
    return (
      <span className="inline-block rounded-[2px] border border-giq-green/40 bg-giq-green/10 px-1.5 py-0.5 font-mono text-[8px] font-bold text-giq-green">
        ⊕ LOW
      </span>
    );
  if (risk === "Moderate")
    return (
      <span className="inline-block rounded-[2px] border border-giq-gold/40 bg-giq-goldDim px-1.5 py-0.5 font-mono text-[8px] font-bold text-giq-gold">
        ⊕ MOD
      </span>
    );
  return (
    <span className="inline-block animate-pulse rounded-[2px] border border-giq-red/50 bg-giq-red/10 px-1.5 py-0.5 font-mono text-[8px] font-bold text-giq-red">
      ⊕ HIGH
    </span>
  );
}

export function BoardRow({
  p,
  onClick,
  onOpenCompare,
}: {
  p: Prospect;
  onClick: () => void;
  onOpenCompare?: () => void;
}) {
  const tr = trend(p);
  const sisCol = sisGradeColor(p.sisGrade);
  return (
    <tr
      onClick={onClick}
      className={cn(
        "cursor-pointer border-b border-white/[0.03] font-mono text-[10px] text-giq-text transition-colors duration-150 ease hover:bg-giq-ink3"
      )}
    >
      <td className="py-2 pl-3">
        <RankBadge rank={p.rank} />
      </td>
      <td className="py-2">
        <div className="font-body text-[13px] font-semibold text-giq-text">{p.name}</div>
        <div className="text-[9px] text-giq-text3">{p.school}</div>
      </td>
      <td className="py-2">
        <PosBadge pos={p.pos} />
      </td>
      <td className="py-2 text-giq-text2">{p.school}</td>
      <td className="py-2 text-giq-text3">{p.conf}</td>
      <td className="py-2">
        <ScoreBar score={p.giqScore} />
      </td>
      <td className="py-2 text-giq-cyan">{p.forty != null ? p.forty.toFixed(2) : "—"}</td>
      <td className="py-2">
        <span
          className="font-mono text-[11px] font-bold"
          style={{ color: sisCol }}
          title={`${p.sisGrade.toFixed(1)} — ${p.sisRole} · ${p.roundProj}`}
        >
          {p.sisGrade.toFixed(1)}
        </span>
      </td>
      <td className="py-2">
        <InjRiskCell risk={p.injuryRisk} />
      </td>
      <td className="py-2">
        <ProbPill prob={p.r1Prob} />
      </td>
      <td className="py-2" style={{ color: tr.c }}>
        {tr.t}
      </td>
      {onOpenCompare ? (
        <td className="py-2">
          <button
            type="button"
            className="rounded-[2px] border border-white/[0.06] px-1 py-0.5 font-mono text-[8px] text-giq-text2 transition-colors duration-150 ease hover:border-giq-gold hover:text-giq-gold"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCompare();
            }}
          >
            ⇄
          </button>
        </td>
      ) : null}
    </tr>
  );
}
