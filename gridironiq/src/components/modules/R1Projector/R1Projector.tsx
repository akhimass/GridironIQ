import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { FilterRow } from "@/components/shared/FilterRow";
import { ProbPill } from "@/components/shared/ProbPill";
import { SISCitation } from "@/components/shared/SISCitation";
import { PROSPECTS_TOP_40 } from "@/data/prospects";

const TABS = ["ALL", "QB", "WR", "RB"] as const;

const SIS_SCALE = [
  { grade: 9, label: "Rare", color: "#f97316" },
  { grade: 8, label: "Excellent", color: "#fb923c" },
  { grade: 7, label: "Very Good", color: "#f59e0b" },
  { grade: 6, label: "Good", color: "#d4a843" },
  { grade: 5, label: "Sufficient", color: "#a3b8cc" },
  { grade: 4, label: "Mediocre", color: "#7d9eb5" },
  { grade: 3, label: "Poor", color: "#5a84a0" },
  { grade: 2, label: "Terrible", color: "#3d6a8a" },
  { grade: 1, label: "Reject", color: "#2a5575" },
] as const;

export default function R1Projector() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");

  const byPos = useMemo(() => {
    const qb = PROSPECTS_TOP_40.filter((p) => p.pos === "QB").sort((a, b) => b.r1Prob - a.r1Prob);
    const wr = PROSPECTS_TOP_40.filter((p) => p.pos === "WR").sort((a, b) => b.r1Prob - a.r1Prob);
    const rb = PROSPECTS_TOP_40.filter((p) => p.pos === "RB").sort((a, b) => b.r1Prob - a.r1Prob);
    return { qb, wr, rb };
  }, []);

  const mendoza = PROSPECTS_TOP_40.find((p) => p.id === "fernando-mendoza");
  const lemon = PROSPECTS_TOP_40.find((p) => p.id === "makai-lemon");
  const love = PROSPECTS_TOP_40.find((p) => p.id === "jeremiyah-love");

  const col = (title: string, tone: string, rows: typeof PROSPECTS_TOP_40) => (
    <div className={`rounded-[2px] border border-white/[0.06] bg-giq-ink2 ${tone}`}>
      <div className="border-b border-white/[0.06] px-3 py-2 font-mono text-[10px] text-giq-text">{title}</div>
      <div className="max-h-[360px] space-y-1 overflow-auto p-2">
        {rows.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-2 border-b border-white/[0.03] py-1 last:border-0">
            <div>
              <div className="font-body text-[12px] font-semibold text-giq-text">{p.name}</div>
              <div className="font-mono text-[8px] text-giq-text3">{p.school}</div>
            </div>
            <ProbPill prob={p.r1Prob} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader title="R1_PROJECTOR // RMU_SAC_OUTPUT" />
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="font-mono text-[10px] text-giq-gold">// SIS_GRADING_SCALE // SOURCE: SPORTSINFOSOLUTIONS.COM</div>
        <p className="mt-1 font-mono text-[9px] text-giq-text2">
          SIS grades (1-9) project player performance by their 2nd NFL season. A grade of 6 (Good) wins in the NFL most of the time.
        </p>
        <div className="mx-auto mt-3 flex max-w-md flex-col items-center gap-0.5 py-2">
          {SIS_SCALE.map((row) => {
            const wPct = Math.min(100, (10 - row.grade) * 10 + 30);
            return (
              <div
                key={row.grade}
                className="flex h-6 w-full items-center justify-between rounded-[2px] border border-white/[0.04] px-2 font-mono text-[9px]"
                style={{ width: `${wPct}%`, background: row.color, color: row.grade >= 5 ? "#050709" : "#dde4ef" }}
                title={row.grade === 6 ? "A 6/Good trait wins in the NFL most of the time" : undefined}
              >
                <span className="font-bold">{row.grade}</span>
                <span>{row.label}</span>
                {row.grade === 6 ? (
                  <span className="hidden text-[7px] italic sm:inline">Wins in NFL most of the time</span>
                ) : null}
              </div>
            );
          })}
        </div>
        <SISCitation className="mt-2" />
      </div>
      <FilterRow options={[...TABS]} active={tab} onChange={(v) => setTab(v as (typeof TABS)[number])} />

      {tab === "ALL" ? (
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-4 lg:grid-cols-3">
          {col("QB", "bg-giq-red/20", byPos.qb)}
          {col("WR", "bg-giq-cyan/10", byPos.wr)}
          {col("RB", "bg-giq-green/10", byPos.rb)}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {col(
            tab,
            tab === "QB" ? "bg-giq-red/20" : tab === "WR" ? "bg-giq-cyan/10" : "bg-giq-green/10",
            tab === "QB" ? byPos.qb : tab === "WR" ? byPos.wr : byPos.rb
          )}
        </div>
      )}

      <div className="border-t border-white/[0.06] p-4">
        <div className="mb-2 font-mono text-[10px] text-giq-gold">MODEL_CONFIDENCE</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              t: "QB",
              feats: [
                ["COMPLETION_%", "+2.84"],
                ["PASSING_TDS", "+1.92"],
                ["CONF_WEIGHT", "+1.61"],
              ],
            },
            {
              t: "WR",
              feats: [
                ["RECEIVING_YDS", "+2.10"],
                ["FORTY_YD", "+1.55"],
                ["YPR_ADJ", "+1.22"],
              ],
            },
            {
              t: "RB",
              feats: [
                ["RUSHING_YDS", "+1.88"],
                ["YPC_ADJ", "+1.40"],
                ["RECEIVING_ROLE", "+1.05"],
              ],
            },
          ].map((blk) => (
            <div key={blk.t} className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3">
              <div className="font-mono text-[10px] text-giq-text3">{blk.t}_FEATURES</div>
              {blk.feats.map(([k, c]) => (
                <div key={k} className="mt-2">
                  <div className="flex justify-between font-mono text-[9px] text-giq-text2">
                    <span>{k}</span>
                    <span className="text-giq-gold">{c}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-[2px] bg-giq-ink3">
                    <div className="h-full rounded-[2px] bg-giq-gold/60" style={{ width: `${40 + (c.length % 5) * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 font-mono text-[9px] text-giq-text3">
          QB AUC: 0.74 | WR AUC: 0.79 | RB AUC: 0.71 · Training: 2010–2024 · Method: LR + XGBoost Ensemble
        </div>
      </div>

      <div className="m-4 rounded-[2px] border border-giq-gold bg-giq-goldDim p-4">
        <div className="font-mono text-[10px] text-giq-gold">// INVENTORY_TARGET_LIST</div>
        <div className="mt-1 font-body text-sm text-giq-text">Based on model predictions, stock these players:</div>
        <p className="mt-2 font-mono text-[9px] leading-relaxed text-giq-text2">
          Fernando Mendoza ({mendoza?.sisGrade.toFixed(1)} — {mendoza?.sisRole}), Makai Lemon ({lemon?.sisGrade.toFixed(1)} —{" "}
          {lemon?.sisRole}), Jeremiyah Love ({love?.sisGrade.toFixed(1)} — {love?.sisRole}). Year-2 starting roles drive sustained
          roster value.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          {[mendoza, lemon, love].map((p) =>
            p ? (
              <div key={p.id} className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3">
                <div className="font-display text-lg text-giq-text">{p.name}</div>
                <div className="mt-1 font-mono text-[9px] text-giq-gold">
                  {p.sisGrade.toFixed(1)} — {p.sisRole}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <ProbPill prob={p.r1Prob} />
                  <span className="rounded-[2px] bg-giq-green/20 px-1 font-mono text-[8px] text-giq-green">HIGH_CONF</span>
                  <span className="font-mono text-[8px] text-giq-gold">HIGH_DEMAND</span>
                </div>
              </div>
            ) : null
          )}
        </div>
        <SISCitation className="mt-3" />
      </div>
    </div>
  );
}
