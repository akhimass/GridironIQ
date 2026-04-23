import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { ProspectDetailModal } from "@/components/modules/ProspectDatabase/ProspectDetailModal";
import { SISCitation } from "@/components/shared/SISCitation";
import { PROSPECTS, type Prospect } from "@/data/prospects";
import { sisRoleLabelAtGrade } from "@/lib/sisGrading";

const GRADE_TIERS = [8.0, 7.5, 7.0, 6.8, 6.6, 6.4, 6.2, 6.0, 5.7] as const;

/** Matrix columns: DT groups IDL (SIS board convention). */
const POSITIONS = ["QB", "RB", "WR", "TE", "OT", "IOL", "DT", "EDGE", "LB", "CB", "S"] as const;

const FILTERS = [
  "ALL",
  "ALL_OFFENSE",
  "ALL_DEFENSE",
  "QB",
  "RB",
  "WR",
  "TE",
  "OT",
  "IOL",
  "DT",
  "EDGE",
  "LB",
  "CB",
  "S",
  "HIDE_DRAFTED",
] as const;

const TIER_LABELS: Record<number, { short: string; italic: string }> = {
  8.0: { short: "Excellent", italic: "Excellent" },
  7.5: { short: "Very Good", italic: "Very Good" },
  7.0: { short: "Very Good", italic: "Very Good" },
  6.8: { short: "Good+", italic: "Good+" },
  6.6: { short: "Good", italic: "Good" },
  6.4: { short: "Good", italic: "Good" },
  6.2: { short: "Good", italic: "Good" },
  6.0: { short: "Good", italic: "Good" },
  5.7: { short: "Sufficient", italic: "Sufficient" },
};

function snapToTier(grade: number): number {
  return GRADE_TIERS.reduce((prev, curr) => (Math.abs(curr - grade) < Math.abs(prev - grade) ? curr : prev));
}

function matrixColForPos(pos: string): (typeof POSITIONS)[number] | null {
  if (pos === "IDL") return "DT";
  if ((POSITIONS as readonly string[]).includes(pos)) return pos as (typeof POSITIONS)[number];
  return null;
}

function chipColors(grade: number): { bg: string; fg: string } {
  if (grade >= 8.0) return { bg: "#f97316", fg: "#050709" };
  if (grade >= 7.0) return { bg: "#f59e0b", fg: "#050709" };
  if (grade >= 6.6) return { bg: "#d4a843", fg: "#050709" };
  if (grade >= 6.0) return { bg: "rgba(212,168,67,0.35)", fg: "#dde4ef" };
  return { bg: "#64748b", fg: "#dde4ef" };
}

function schoolAbbr(school: string) {
  const w = school.replace(/[^a-zA-Z]/g, "");
  return w.slice(0, 3).toUpperCase() || "UNK";
}

function groupByMatrix(prospects: Prospect[]) {
  const matrix: Record<number, Record<string, Prospect[]>> = {};
  GRADE_TIERS.forEach((tier) => {
    matrix[tier] = {};
    POSITIONS.forEach((pos) => {
      matrix[tier][pos] = [];
    });
  });
  prospects.forEach((p) => {
    const col = matrixColForPos(p.pos);
    if (!col) return;
    const tier = snapToTier(p.sisGrade);
    if (matrix[tier]?.[col]) matrix[tier][col].push(p);
  });
  GRADE_TIERS.forEach((tier) => {
    POSITIONS.forEach((pos) => {
      matrix[tier][pos].sort((a, b) => b.giqScore - a.giqScore);
    });
  });
  return matrix;
}

export default function DraftMatrix() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [modal, setModal] = useState<Prospect | null>(null);

  const filtered = useMemo(() => {
    let list = [...PROSPECTS];
    if (filter === "ALL_OFFENSE")
      list = list.filter((p) => ["QB", "RB", "WR", "TE", "OT", "IOL"].includes(p.pos));
    else if (filter === "ALL_DEFENSE")
      list = list.filter((p) => ["EDGE", "IDL", "LB", "CB", "S"].includes(p.pos));
    else if (filter === "DT") list = list.filter((p) => p.pos === "IDL");
    else if (filter !== "ALL" && filter !== "HIDE_DRAFTED") list = list.filter((p) => p.pos === filter);
    return list;
  }, [filter]);

  const matrix = useMemo(() => groupByMatrix(filtered), [filtered]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader
        title="DRAFT_MATRIX // ROLE-BASED GRADING"
        subtitle="SOURCE: SIS METHODOLOGY · GRADES PROJECTED TO YEAR 2 NFL · DATA: nflverse · MODEL: GIQ v2.0"
      />

      <div className="flex flex-wrap gap-1 border-b border-white/[0.06] px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-[2px] border px-2 py-1 font-mono text-[8px] tracking-wide transition-colors duration-150 ease ${
              filter === f
                ? "border-giq-gold bg-giq-goldDim text-giq-gold"
                : "border-white/[0.06] text-giq-text2 hover:border-giq-gold/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-2">
        <table className="w-full min-w-[960px] border-collapse font-mono text-[9px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-giq-text3">
              <th className="sticky left-0 z-10 bg-giq-ink py-2 pl-2 text-left">GRADE</th>
              {POSITIONS.map((pos) => (
                <th key={pos} className="min-w-[88px] px-1 py-2 text-center">
                  {pos}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRADE_TIERS.map((tier) => {
              const lab = TIER_LABELS[tier] ?? { short: "", italic: "" };
              const tierPill =
                tier >= 8
                  ? "bg-[#f97316] text-giq-ink"
                  : tier >= 7
                    ? "bg-[#f59e0b] text-giq-ink"
                    : tier >= 6.6
                      ? "bg-giq-gold text-giq-ink"
                      : "bg-giq-gold/30 text-giq-text";
              return (
                <tr key={tier} className="border-b border-white/[0.03] align-top">
                  <td className="sticky left-0 z-10 bg-giq-ink py-2 pl-2">
                    <div className={`inline-block rounded-[2px] px-2 py-0.5 font-bold ${tierPill}`}>{tier.toFixed(1)}</div>
                    <div className="mt-1 italic text-giq-text2" style={{ fontSize: 8 }}>
                      {lab.italic}
                    </div>
                  </td>
                  {POSITIONS.map((pos) => {
                    const cell = matrix[tier][pos] ?? [];
                    return (
                      <td key={`${tier}-${pos}`} className="border-l border-white/[0.03] px-1 py-1 align-top">
                        <div className="flex min-h-[48px] flex-col gap-1">
                          {cell.map((p) => {
                            const { bg, fg } = chipColors(p.sisGrade);
                            const tierRole = sisRoleLabelAtGrade(p.pos, tier);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                title={`${tier.toFixed(1)} row @ ${p.pos}: ${tierRole}\n${p.sisGrade.toFixed(1)} — ${p.sisRole} · GIQ ${p.giqScore.toFixed(1)}`}
                                onClick={() => setModal(p)}
                                className="flex items-center gap-1 rounded-[2px] border border-white/[0.06] px-1 py-1 text-left transition-opacity duration-150 ease hover:opacity-90"
                                style={{ background: bg, color: fg }}
                              >
                                <span
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] text-[7px] font-bold"
                                  style={{ background: "rgba(0,0,0,0.25)", color: fg }}
                                >
                                  {schoolAbbr(p.school)}
                                </span>
                                <span className="truncate font-body text-[10px] font-semibold leading-tight">{p.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-2">
        <SISCitation />
      </div>

      <ProspectDetailModal prospect={modal} open={!!modal} onOpenChange={(o) => !o && setModal(null)} />
    </div>
  );
}
