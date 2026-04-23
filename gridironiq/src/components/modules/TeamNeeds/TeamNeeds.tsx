import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { Button } from "@/components/ui/button";
import { carNeeds } from "@/data/carNeeds";
import { teams } from "@/data/teams";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  computeAdjustedNeedScores,
  needDeltas,
  type NeedBucket,
  NEED_BUCKETS,
} from "@/lib/offseasonNeeds";
import transactionsBundle from "@/data/offseason/transactions_2026.json";

const LAYERS = [
  { id: "EPA_NEED", w: 0.45 },
  { id: "INJURY_PRESS", w: 0.3 },
  { id: "ROOM_PROD", w: 0.25 },
  { id: "SNAP_DEPTH", w: 0.0, disabled: true },
] as const;

const POS_ROWS = ["LB", "IDL", "TE", "CB", "IOL", "EDGE", "WR", "SAF", "OT", "RB", "QB"] as const;

/** Synthetic heat values for CAR — deterministic placeholder */
function carHeat(layer: string, pos: string): number {
  const seed = (layer.length + pos.charCodeAt(0)) % 37;
  return 42 + seed + (pos === "LB" ? 22 : pos === "TE" ? 18 : 0);
}

function cellColor(v: number) {
  if (v > 80) return "#3ecf7a";
  if (v >= 50) return "#d4a843";
  return "#3d4f66";
}

type ViewMode = "BASE" | "ADJUSTED" | "BOTH";

function levelFromScore(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export default function TeamNeeds() {
  const [team, setTeam] = useState("CAR");
  const [view, setView] = useState<ViewMode>("BOTH");

  const carBaseRecord = useMemo(() => {
    const m: Partial<Record<NeedBucket, number>> = {};
    for (const row of carNeeds) m[row.pos as NeedBucket] = row.score;
    for (const b of NEED_BUCKETS) {
      if (m[b] == null) m[b] = 42;
    }
    return m;
  }, []);

  const adjustedCar = useMemo(
    () => computeAdjustedNeedScores("CAR", carBaseRecord, transactionsBundle.transactions ?? []),
    [carBaseRecord],
  );
  const deltasCar = useMemo(() => needDeltas(carBaseRecord, adjustedCar), [carBaseRecord, adjustedCar]);

  const needs = useMemo(() => {
    if (team === "CAR") {
      return POS_ROWS.map((pos) => {
        const b = pos as NeedBucket;
        const base = Number(carBaseRecord[b] ?? 0);
        const adj = adjustedCar[b];
        const d = deltasCar[b];
        const score =
          view === "BASE" ? base : view === "ADJUSTED" ? adj : Math.round(((base + adj) / 2) * 10) / 10;
        const levelScore = view === "BASE" ? base : adj;
        return {
          pos,
          score: view === "BOTH" ? adj : score,
          base,
          adj,
          delta: d,
          level: levelFromScore(levelScore),
        };
      });
    }
    return POS_ROWS.map((pos) => ({
      pos,
      score: 40 + (pos.charCodeAt(0) % 30),
      base: null as number | null,
      adj: null as number | null,
      delta: null as number | null,
      level: "medium" as const,
    }));
  }, [team, view, carBaseRecord, adjustedCar, deltasCar]);

  const levelColor = (level: string) => {
    if (level === "critical") return "#e05252";
    if (level === "high") return "#f59e0b";
    if (level === "medium") return "#d4a843";
    return "#3d4f66";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader
        title="TEAM_NEEDS // CAROLINA_PANTHERS · 2025"
        subtitle="SIGNAL_LAYERS: EPA × SNAP × INJURY × ROOM_PROD"
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="font-mono text-[10px] text-giq-text3">TEAM_SELECTOR</span>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="h-9 w-[200px] rounded-[2px] border border-white/[0.06] bg-giq-ink2 font-mono text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-[2px] border border-white/[0.06] bg-giq-ink2">
            {teams.map((t) => (
              <SelectItem key={t.abbr} value={t.abbr} className="font-mono text-[10px]">
                {t.abbr} — {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {team === "CAR" ? (
          <div className="flex gap-1">
            {(["BASE", "ADJUSTED", "BOTH"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 rounded-[2px] px-2 font-mono text-[8px] ${view === m ? "bg-giq-goldDim text-giq-gold" : "text-giq-text3"}`}
                onClick={() => setView(m)}
              >
                {m === "BOTH" ? "SHOW BOTH" : `SHOW ${m}`}
              </Button>
            ))}
          </div>
        ) : (
          <span className="font-mono text-[9px] text-giq-text3">PLACEHOLDER_WEIGHTS · ONLY_CAR_PIPELINE_ATTACHED</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {needs.map((n) => (
          <div key={n.pos} className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3">
            <div className="font-mono text-[9px] text-giq-text3">{n.pos}</div>
            <div className="font-display text-3xl" style={{ color: levelColor(n.level) }}>
              {team === "CAR" && view === "BOTH" && n.adj != null && n.base != null ? (
                <span className="text-2xl">
                  {n.base} → {n.adj}
                </span>
              ) : (
                n.score
              )}
            </div>
            {team === "CAR" && view === "BOTH" && n.delta != null ? (
              <div
                className="mt-1 font-mono text-[10px]"
                style={{ color: n.delta < -0.01 ? "#3ecf7a" : n.delta > 0.01 ? "#e05252" : "#9ca3af" }}
              >
                {n.delta < -0.01 ? "↓" : n.delta > 0.01 ? "↑" : "→"} {n.delta >= 0 ? "+" : ""}
                {n.delta.toFixed(1)}
              </div>
            ) : null}
            <div className="mt-2 h-0.5 rounded-[2px] bg-giq-ink3">
              <div
                className="h-full rounded-[2px]"
                style={{
                  width: `${team === "CAR" && n.adj != null ? n.adj : n.score}%`,
                  backgroundColor: levelColor(n.level),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="mb-2 font-mono text-[10px] text-giq-gold">SIGNAL_BREAKDOWN_MATRIX</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] font-mono text-[9px]">
            <thead>
              <tr className="text-giq-text3">
                <th className="p-1 text-left">POS</th>
                {LAYERS.map((l) => (
                  <th key={l.id} className="p-1">
                    {l.id}
                    <span className="block text-[8px] text-giq-text3">w={l.w}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POS_ROWS.map((pos) => (
                <tr key={pos} className="border-t border-white/[0.03]">
                  <td className="p-1 text-giq-text2">{pos}</td>
                  {LAYERS.map((l) => {
                    const v = team === "CAR" ? carHeat(l.id, pos) : 50 + (pos.charCodeAt(0) % 20);
                    const off = "disabled" in l && l.disabled;
                    return (
                      <td key={l.id} className="p-1 text-center" style={{ color: cellColor(off ? 30 : v) }}>
                        {off ? "—" : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="m-4 rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-4">
        <div className="font-mono text-[10px] text-giq-gold">SCHEME_VECTOR // 10_DIM</div>
        <div className="mt-2 space-y-1 font-mono text-[10px] text-giq-text2">
          <div>
            off_pass_rate: <span className="text-giq-text">41.8%</span> (run-heavy)
          </div>
          <div>
            te_target_share: <span className="text-giq-text">20.6%</span> (↑ +0.011/yr)
          </div>
          <div>
            edge_pressure_trend: <span className="text-giq-text">↓ -0.052</span> (triggers bonus)
          </div>
          <div>
            off_pass_epa: <span className="text-giq-text">-0.050</span> (below avg)
          </div>
        </div>
      </div>
    </div>
  );
}
