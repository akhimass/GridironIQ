import { useEffect, useState } from "react";
import { RadarChart } from "@/components/shared/RadarChart";
import { SISCitation } from "@/components/shared/SISCitation";
import { TraitBar } from "@/components/shared/TraitBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Prospect } from "@/data/prospects";

function SignalBar({ label, v, color }: { label: string; v: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(Math.min(100, Math.max(0, v))));
    return () => cancelAnimationFrame(t);
  }, [v]);
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between font-mono text-[9px] text-giq-text2">
        <span style={{ color }}>{label}</span>
        <span>{v}</span>
      </div>
      <div className="h-1 rounded-[2px] bg-giq-ink3">
        <div className="h-full rounded-[2px] transition-[width] duration-[800ms] ease-out" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function nflComp(notes: string) {
  const m = notes.match(/comp:\s*([^—]+)/i);
  return m ? m[1].trim() : "See notes / cross-pos context";
}

function RiskBadge({ risk }: { risk: Prospect["injuryRisk"] }) {
  if (risk === "Low") return <span className="text-giq-green">Low Risk</span>;
  if (risk === "Moderate") return <span className="text-giq-gold">Moderate Risk</span>;
  return <span className="animate-pulse text-giq-red">High Risk</span>;
}

const SCALE_LEGEND = [
  "9=Rare",
  "8=Excellent",
  "7=Very Good",
  "6=Good (wins)",
  "5=Sufficient",
  "4=Mediocre",
  "3=Poor",
  "2=Terrible",
  "1=Reject",
];

export function ProspectDetailModal({
  prospect,
  open,
  onOpenChange,
}: {
  prospect: Prospect | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [tab, setTab] = useState<"combine" | "stats" | "sis">("combine");

  useEffect(() => {
    if (prospect) setTab("combine");
  }, [prospect?.id]);

  if (!prospect) return null;
  const p = prospect;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,640px)]">
        <DialogHeader>
          <DialogTitle>
            {p.name}{" "}
            <span className="font-mono text-sm text-giq-text2">
              {p.pos} · {p.school} · {p.conf}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-2 flex gap-1 border-b border-white/[0.06] pb-2">
          {(["combine", "stats", "sis"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-[2px] border px-2 py-1 font-mono text-[9px] uppercase tracking-wide transition-colors duration-150 ease ${
                tab === t ? "border-giq-gold bg-giq-goldDim text-giq-gold" : "border-white/[0.06] text-giq-text2 hover:text-giq-text"
              }`}
            >
              {t === "combine" ? "COMBINE" : t === "stats" ? "STATS" : "SIS_GRADES"}
            </button>
          ))}
        </div>

        {tab === "combine" ? (
          <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-giq-text3">
            {[
              ["40_YD", p.forty != null ? String(p.forty) : "—"],
              ["VERTICAL", p.vertical != null ? `${p.vertical}"` : "—"],
              ["BROAD", p.broadJump != null ? `${p.broadJump}"` : "—"],
              ["BENCH", p.bench != null ? String(p.bench) : "—"],
              ["CONE", "—"],
              ["SHUTTLE", "—"],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-[2px] border border-white/[0.06] bg-giq-ink3 p-2">
                <div>{k}</div>
                <div className="text-giq-text">{v}</div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "stats" ? (
          <>
            <div className="font-mono text-[9px] text-giq-gold">COLLEGE_STATS</div>
            <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-[9px] text-giq-text2">
              {Object.entries(p.stats).map(([k, v]) => (
                <div key={k} className="rounded-[2px] border border-white/[0.06] p-2">
                  {k}: <span className="text-giq-text">{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 font-mono text-[9px] text-giq-gold">SCORE_BREAKDOWN</div>
            <SignalBar label="ATH" v={p.athleticism} color="#d4a843" />
            <SignalBar label="PROD" v={p.production} color="#29b8e0" />
            <SignalBar label="EFF" v={p.efficiency} color="#3ecf7a" />
            <SignalBar label="SCHEME" v={p.schemeFit} color="#3ecf7a" />
            <SignalBar label="NEED" v={p.teamNeed} color="#d4a843" />
            <div className="mt-2 flex justify-center">
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
            </div>
            <div className="mt-2 font-mono text-[9px] text-giq-text3">NFL_COMP</div>
            <div className="font-body text-sm text-giq-text">{nflComp(p.notes)}</div>
            <div className="mt-2 font-mono text-[9px] text-giq-text3">NOTES</div>
            <p className="font-mono text-[10px] text-giq-text2">{p.notes}</p>
            <div className="mt-3 font-mono text-[9px] text-giq-text3">R1_PROBABILITY</div>
            <div className="h-2 rounded-[2px] bg-giq-ink3">
              <div className="h-full rounded-[2px] bg-giq-gold" style={{ width: `${p.r1Prob * 100}%` }} />
            </div>
            <div className="mt-1 font-mono text-[10px] text-giq-gold">{Math.round(p.r1Prob * 100)}%</div>
          </>
        ) : null}

        {tab === "sis" ? (
          <div className="rounded-[2px] border border-white/[0.06] bg-giq-ink text-giq-text">
            <div
              className="flex items-start justify-between border-b border-white/[0.06] px-3 py-2"
              style={{ background: "#dde4ef", color: "#050709" }}
            >
              <div>
                <div className="font-body text-base font-bold">{p.name}</div>
                <div className="font-mono text-[9px] opacity-80">
                  {p.pos} · {p.school}
                </div>
              </div>
              <div className="rounded-[2px] border border-white/[0.2] px-2 py-0.5 font-mono text-[9px] font-bold">
                <RiskBadge risk={p.injuryRisk} />
              </div>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="font-display text-4xl text-giq-gold">{p.sisGrade.toFixed(1)}</div>
                <div className="font-mono text-[10px] text-giq-text2">
                  GIQ {p.giqScore.toFixed(1)} · {p.roundProj}
                </div>
              </div>
              <p className="mt-1 font-mono text-[10px] text-giq-gold">{p.sisRole}</p>
              <div className="mt-4 border-b border-giq-ink2 bg-giq-ink3 px-2 py-1 font-mono text-[9px] text-giq-gold">CRITICAL_FACTORS</div>
              {p.traits.criticalFactors.map((t) => (
                <TraitBar key={t.trait} trait={t.trait} grade={t.grade} />
              ))}
              <div className="mt-2 border-b border-giq-ink2 bg-giq-ink3 px-2 py-1 font-mono text-[9px] text-giq-text3">POSITIONAL_FACTORS</div>
              {p.traits.positionalFactors.map((t) => (
                <TraitBar key={t.trait} trait={t.trait} grade={t.grade} />
              ))}
              <div className="mt-4 font-mono text-[8px] leading-relaxed text-giq-text3">
                {SCALE_LEGEND.join(" · ")}
              </div>
              <div className="mt-3">
                <SISCitation />
              </div>
            </div>
          </div>
        ) : null}

        {tab === "combine" ? (
          <>
            <div className="mt-3 font-mono text-[9px] text-giq-gold">GIQ + SIS (summary)</div>
            <p className="font-mono text-[10px] text-giq-text2">
              {p.sisGrade.toFixed(1)} — {p.sisRole} · Injury: {p.injuryRisk}
            </p>
          </>
        ) : null}

        <div className="mt-4 flex gap-2">
          <Button variant="ghost">ADD_TO_MY_BOARD</Button>
          <Button variant="gold">COMPARE</Button>
        </div>
        <SISCitation />
      </DialogContent>
    </Dialog>
  );
}
