import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Prospect } from "@/data/prospects";
import { RadarChart } from "@/components/shared/RadarChart";
import { SISCitation } from "@/components/shared/SISCitation";
import { TraitBar } from "@/components/shared/TraitBar";
import { Button } from "@/components/ui/button";

function RpHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-white/[0.06] px-3 py-2 font-mono text-[9px] tracking-wide text-giq-text3">
      <span className="text-giq-gold">// </span>
      {children}
    </div>
  );
}

function InjuryBadge({ risk }: { risk: Prospect["injuryRisk"] }) {
  if (risk === "Low")
    return (
      <span className="inline-flex items-center gap-1 rounded-[2px] border border-giq-green/40 bg-giq-green/10 px-2 py-0.5 font-mono text-[8px] font-bold text-giq-green">
        ⊕ LOW_RISK
      </span>
    );
  if (risk === "Moderate")
    return (
      <span className="inline-flex items-center gap-1 rounded-[2px] border border-giq-gold/40 bg-giq-goldDim px-2 py-0.5 font-mono text-[8px] font-bold text-giq-gold">
        ⊕ MOD_RISK
      </span>
    );
  return (
    <span className="inline-flex animate-pulse items-center gap-1 rounded-[2px] border border-giq-red/50 bg-giq-red/10 px-2 py-0.5 font-mono text-[8px] font-bold text-giq-red">
      ⊕ HIGH_RISK
    </span>
  );
}

export default function RightPanel({ prospect }: { prospect: Prospect | null }) {
  const p = prospect;
  const [posOpen, setPosOpen] = useState(false);

  useEffect(() => {
    setPosOpen(false);
  }, [p?.id]);

  return (
    <aside
      className="hidden w-[280px] shrink-0 border-l border-white/[0.06] bg-giq-ink2 lg:block"
      style={{ width: 280, background: "#0a0d14" }}
    >
      <RpHeader>SELECTED_PROSPECT</RpHeader>
      {!p ? (
        <div className="p-4 font-mono text-[10px] text-giq-text3">NO_SELECTION // CLICK_ROW</div>
      ) : (
        <div className="border-b border-white/[0.06] p-4">
          <div className="font-display text-[22px] leading-tight tracking-wide text-giq-text">{p.name}</div>
          <div className="mt-1 font-mono text-[9px] text-giq-text3">
            {p.pos} · {p.school} · {p.height} · {p.weight}LB · {p.conf}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="font-display text-[44px] leading-none text-giq-gold">{p.giqScore.toFixed(1)}</div>
            <div className="font-mono text-[9px] text-giq-text3">GIQ</div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <InjuryBadge risk={p.injuryRisk} />
            <span className="font-mono text-[8px] text-giq-text3">{p.roundProj}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["40_YD", p.forty != null ? p.forty.toFixed(2) : "—", "#29b8e0"],
              ["VERTICAL", p.vertical != null ? `${p.vertical}"` : "—", "#29b8e0"],
              ["SEASON_TD", String(p.stats.receivingTds ?? p.stats.rushingTds ?? p.stats.passingTds ?? "—"), "#3ecf7a"],
              ["R1_PROB", `${Math.round(p.r1Prob * 100)}%`, "#d4a843"],
            ].map(([k, val, col]) => (
              <div key={String(k)} className="rounded-[2px] bg-giq-ink3 p-2" style={{ background: "#0f131e" }}>
                <div className="font-mono text-[8px] text-giq-text3">{k}</div>
                <div className="font-mono text-sm font-bold" style={{ color: col as string }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RpHeader>PROSPECT_RADAR</RpHeader>
      <div className="flex justify-center border-b border-white/[0.06] py-3">
        {p ? (
          <RadarChart
            scores={{
              ath: p.athleticism,
              prod: p.production,
              eff: p.efficiency,
              scheme: p.schemeFit,
              need: p.teamNeed,
              cmb: p.athleticism * 0.6 + p.production * 0.4,
            }}
          />
        ) : (
          <div className="h-[180px] w-[180px] rounded-[2px] border border-dashed border-white/[0.06]" />
        )}
      </div>

      <RpHeader>SIS_TRAIT_GRADES</RpHeader>
      <div className="border-b border-white/[0.06] p-3">
        {p ? (
          <>
            <div className="font-display text-3xl leading-none text-giq-gold">{p.sisGrade.toFixed(1)}</div>
            <div className="mt-1 font-mono text-[9px] text-giq-gold">{p.sisRole}</div>
            <div className="mt-2">
              <InjuryBadge risk={p.injuryRisk} />
            </div>
            <div className="mt-3 font-mono text-[9px] text-giq-gold">// CRITICAL_FACTORS</div>
            {p.traits.criticalFactors.map((t) => (
              <TraitBar key={t.trait} trait={t.trait} grade={t.grade} />
            ))}
            <button
              type="button"
              onClick={() => setPosOpen((o) => !o)}
              className="mt-2 flex w-full items-center gap-1 border-t border-white/[0.06] pt-2 font-mono text-[9px] text-giq-text3 transition-colors duration-150 ease hover:text-giq-text"
            >
              {posOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              // POSITIONAL_FACTORS
            </button>
            {posOpen ? (
              <div className="mt-1">
                {p.traits.positionalFactors.map((t) => (
                  <TraitBar key={t.trait} trait={t.trait} grade={t.grade} />
                ))}
              </div>
            ) : null}
            <div className="mt-3">
              <SISCitation />
            </div>
          </>
        ) : null}
      </div>

      <RpHeader>MODEL_STATUS</RpHeader>
      <div className="space-y-1 border-b border-white/[0.06] p-3 font-mono text-[9px]">
        {[
          ["CFBD_API", "OFFLINE", "#e05252"],
          ["nflverse", "ACTIVE", "#3ecf7a"],
          ["CONSENSUS_DIR", "NOT_SET", "#e05252"],
          ["XGB_MODEL", "LOADED", "#3ecf7a"],
          ["CACHE", "STALE_24H", "#d4a843"],
          ["SNAP_DEPTH", "DEGEN", "#e05252"],
          ["COSINE_NORM", "FIX_NEEDED", "#e05252"],
          ["RMU_TRAIN", "2010-2024", "#3ecf7a"],
          ["AUC_SCORE", "0.78", "#d4a843"],
          ["SIS_GRADES", "ACTIVE", "#3ecf7a"],
          ["SIS_SOURCE", "nfldraft.sportsinfosolutions.com", "#3d4f66"],
        ].map(([k, v, c]) => (
          <div key={String(k)} className="flex justify-between">
            <span className="text-giq-text3">{k}</span>
            <span style={{ color: c as string }}>{v}</span>
          </div>
        ))}
      </div>

      <RpHeader>QUICK_ACTIONS</RpHeader>
      <div className="flex flex-col gap-2 p-3">
        <Button variant="ghost" className="w-full justify-start">
          ▶ RUN_PIPELINE --team CAR
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          ⬇ EXPORT_BOARD .CSV
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          ⊕ ADD_TO_MY_BOARD
        </Button>
        <Button variant="gold" className="w-full justify-start">
          ★ RMU_SUBMIT_PREDICTIONS
        </Button>
        <SISCitation />
      </div>
    </aside>
  );
}
