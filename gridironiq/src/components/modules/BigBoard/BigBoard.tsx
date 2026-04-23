import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { FilterRow } from "@/components/shared/FilterRow";
import { carNeeds } from "@/data/carNeeds";
import { PROSPECTS_TOP_40, type Prospect } from "@/data/prospects";
import transactionsBundle from "@/data/offseason/transactions_2026.json";
import { computeAdjustedNeedScores, type NeedBucket, NEED_BUCKETS } from "@/lib/offseasonNeeds";
import { BoardTable } from "./BoardTable";

const TABS = [
  "CONSENSUS_BOARD",
  "MODEL_BOARD",
  "R1_PROJECTIONS",
  "RMU_PREDICTIONS",
  "BY_TEAM_FIT",
  "TEAM_FIT_ADJUSTED",
] as const;

const POS_FILTERS = [
  "ALL",
  "QB",
  "WR",
  "RB",
  "EDGE",
  "OT",
  "TE",
  "CB",
  "S",
  "LB",
  "IDL",
  "R1_ONLY",
  "P4_CONF",
  "COMBINE_ATT",
];

const P4 = new Set(["SEC", "B10", "B12", "ACC", "Pac-12"]);

const CAR_BASE: Partial<Record<NeedBucket, number>> = (() => {
  const m: Partial<Record<NeedBucket, number>> = {};
  for (const row of carNeeds) m[row.pos as NeedBucket] = row.score;
  for (const b of NEED_BUCKETS) {
    if (m[b] == null) m[b] = 42;
  }
  return m;
})();

const CAR_ADJUSTED = computeAdjustedNeedScores("CAR", CAR_BASE, transactionsBundle.transactions ?? []);

function teamFitAdjustedScore(p: Prospect): number {
  const posKey = (p.pos === "S" ? "SAF" : p.pos) as NeedBucket;
  const need = CAR_ADJUSTED[posKey] ?? 40;
  return p.giqScore * 0.75 + need * 0.45;
}

export default function BigBoard({
  onSelectProspect,
  onOpenCompare,
}: {
  onSelectProspect: (p: Prospect) => void;
  onOpenCompare?: (p: Prospect) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("MODEL_BOARD");
  const [pos, setPos] = useState("ALL");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    let list = [...PROSPECTS_TOP_40];
    if (pos !== "ALL" && !["R1_ONLY", "P4_CONF", "COMBINE_ATT"].includes(pos)) {
      list = list.filter((p) => p.pos === pos || (pos === "S" && p.pos === "S"));
    }
    if (pos === "R1_ONLY") list = list.filter((p) => p.r1Prob >= 0.6);
    if (pos === "P4_CONF") list = list.filter((p) => P4.has(p.conf) || p.conf === "IND");
    if (pos === "COMBINE_ATT") list = list.filter((p) => p.forty != null);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.school.toLowerCase().includes(q));
    }
    if (tab === "MODEL_BOARD") list.sort((a, b) => b.giqScore - a.giqScore);
    if (tab === "R1_PROJECTIONS") list = list.filter((p) => p.r1Prob > 0.5).sort((a, b) => b.r1Prob - a.r1Prob);
    if (tab === "RMU_PREDICTIONS")
      list = list.filter((p) => ["QB", "WR", "RB"].includes(p.pos)).sort((a, b) => b.r1Prob - a.r1Prob);
    if (tab === "BY_TEAM_FIT") list.sort((a, b) => b.teamNeed - a.teamNeed);
    if (tab === "TEAM_FIT_ADJUSTED") list.sort((a, b) => teamFitAdjustedScore(b) - teamFitAdjustedScore(a));
    return list;
  }, [tab, pos, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <div className="grid grid-cols-5 border-b border-white/[0.06] bg-giq-ink2 px-2 py-2 font-mono text-[9px] text-giq-text2 sm:px-4">
        {[
          ["R1_PROJECTED", "14", "OF 32 OFF. SKILL"],
          ["MODEL_ACCURACY", "78%", "HOLDOUT_SET_AUC"],
          ["PROSPECTS_SCORED", "319", "QB+WR+RB+DEF"],
          ["TOP_SCORE", "96.3", "MENDOZA · QB"],
          ["TRAINING_YEARS", "14", "2010 – 2024"],
        ].map(([a, b, c]) => (
          <div key={String(a)} className="border-r border-white/[0.03] px-1 last:border-r-0">
            <div className="text-giq-text3">{a}</div>
            <div className="font-display text-lg text-giq-gold">{b}</div>
            <div className="text-[8px] text-giq-text3">{c}</div>
          </div>
        ))}
      </div>

      <ModuleHeader
        title="BIG_BOARD // DRAFT_INTEL"
        subtitle="GRADES: SIS METHODOLOGY · DATA: nflverse · MODEL: GIQ v2.0"
        actions={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH..."
            className="w-40 rounded-[2px] border border-white/[0.06] bg-giq-ink3 px-2 py-1 font-mono text-[10px] text-giq-text"
          />
        }
      />

      <FilterRow options={[...TABS]} active={tab} onChange={(v) => setTab(v as (typeof TABS)[number])} />
      <FilterRow options={POS_FILTERS} active={pos} onChange={setPos} />

      <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
        <BoardTable rows={rows} onSelect={onSelectProspect} onOpenCompare={onOpenCompare} />
      </div>
    </div>
  );
}
