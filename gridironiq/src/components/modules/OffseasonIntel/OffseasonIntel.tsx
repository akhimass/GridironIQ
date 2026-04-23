import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { PosBadge } from "@/components/shared/PosBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { carNeeds } from "@/data/carNeeds";
import divisionContext from "@/data/offseason/division_context.json";
import transactionsBundle from "@/data/offseason/transactions_2026.json";
import {
  computeAdjustedNeedScores,
  divisionContextForTeam,
  movesForTeam,
  needDeltas,
  pickChanges,
  strategicInsights,
  transactionSources,
  type NeedBucket,
  NEED_BUCKETS,
  type OffseasonTx,
} from "@/lib/offseasonNeeds";
import { teams, teamByAbbr } from "@/data/teams";

const TABS = ["OWN_MOVES", "DIVISION_WATCH", "NEED_IMPACT", "PICK_CHANGES"] as const;

function insightTag(line: string): "DRAFT_ADVANTAGE" | "BOARD_OVERLAP" | "DIVISION_GAP" {
  const u = line.toUpperCase();
  if (u.includes("MISMATCH") || u.includes("BEST PASS RUSH")) return "DRAFT_ADVANTAGE";
  if (u.includes("OVERLAP") || u.includes("STILL NEEDS")) return "BOARD_OVERLAP";
  return "DIVISION_GAP";
}

function contractLabel(tx: OffseasonTx): string {
  const c = tx.contract;
  if (!c?.years && !c?.aav) return "Trade / terms n/a";
  const yrs = c.years ?? 0;
  const aav = c.aav ?? 0;
  const gtd = c.guaranteed;
  if (yrs === 1 && aav > 0) return `1yr bridge · $${(aav / 1e6).toFixed(1)}M AAV`;
  const parts = [`${yrs}yr`];
  if (aav) parts.push(`$${(aav / 1e6).toFixed(1)}M AAV`);
  if (gtd) parts.push(`$${(gtd / 1e6).toFixed(0)}M gtd`);
  return parts.join(" · ");
}

function moveBadge(type: string, team: string, tx: OffseasonTx): { label: string; color: string } {
  const u = team.toUpperCase();
  if (type === "trade" && tx.to_team === u) return { label: "TRADED_IN", color: "#29b8e0" };
  if (type === "trade" && tx.from_team === u) return { label: "TRADED_AWAY", color: "#d4a843" };
  if (type === "free_agency_signing") return { label: "SIGNED", color: "#3ecf7a" };
  if (type === "free_agency_loss") return { label: "LOST", color: "#e05252" };
  return { label: type.toUpperCase(), color: "#9ca3af" };
}

function baseScoresForTeam(team: string): Partial<Record<NeedBucket, number>> {
  if (team === "CAR") {
    const m: Partial<Record<NeedBucket, number>> = {};
    for (const row of carNeeds) {
      m[row.pos as NeedBucket] = row.score;
    }
    for (const b of NEED_BUCKETS) {
      if (m[b] == null) m[b] = 42;
    }
    return m;
  }
  const t = teamByAbbr(team);
  const m: Partial<Record<NeedBucket, number>> = {};
  for (const b of NEED_BUCKETS) m[b] = 38;
  if (t) {
    m[t.needs[0] as NeedBucket] = 76;
    m[t.needs[1] as NeedBucket] = 72;
  }
  return m;
}

export default function OffseasonIntel() {
  const [team, setTeam] = useState("CAR");
  const [tab, setTab] = useState<(typeof TABS)[number]>("OWN_MOVES");

  const txs = (transactionsBundle.transactions ?? []) as OffseasonTx[];
  const srcLines = transactionSources();

  const teamMoves = useMemo(() => {
    const list = movesForTeam(team, txs).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    return list;
  }, [team, txs]);

  const base = useMemo(() => baseScoresForTeam(team), [team]);
  const adjusted = useMemo(() => computeAdjustedNeedScores(team, base, txs), [team, base, txs]);
  const deltas = useMemo(() => needDeltas(base, adjusted), [base, adjusted]);

  const summary = useMemo(() => {
    const neg = NEED_BUCKETS.map((b) => [b, deltas[b]] as const)
      .filter(([, d]) => d < -0.05)
      .sort((a, b) => a[1] - b[1]);
    const biggest = neg[0];
    return {
      n: teamMoves.length,
      biggest: biggest ? `${biggest[0]} ${biggest[1].toFixed(1)}` : "—",
    };
  }, [deltas, teamMoves.length]);

  const divCtx = divisionContextForTeam(team);
  const insights = useMemo(() => strategicInsights(team), [team]);
  const picks = pickChanges();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader
        title="// OFFSEASON_INTEL // FREE_AGENCY + TRADES"
        subtitle={`SOURCES: ${srcLines.slice(0, 2).join(" · ")} · transactions_2026.json`}
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="font-mono text-[10px] text-giq-text3">TEAM</span>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="h-9 w-[220px] rounded-[2px] border border-white/[0.06] bg-giq-ink2 font-mono text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72 rounded-[2px] border border-white/[0.06] bg-giq-ink2">
            {teams.map((t) => (
              <SelectItem key={t.abbr} value={t.abbr} className="font-mono text-[10px]">
                {t.abbr} — {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="font-mono text-[10px] text-giq-text3">SEASON · 2026 OFFSEASON OVERRIDE</span>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-white/[0.06] px-2 py-2">
        {TABS.map((t) => (
          <Button
            key={t}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTab(t)}
            className={`h-8 rounded-[2px] font-mono text-[9px] tracking-wide ${
              tab === t ? "bg-giq-goldDim text-giq-gold" : "text-giq-text2"
            }`}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {tab === "OWN_MOVES" ? (
          <div className="space-y-4">
            <div className="font-mono text-[10px] text-giq-gold">// {team} OFFSEASON TRANSACTIONS</div>
            <div className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3 font-mono text-[10px] text-giq-text2">
              {summary.n} moves · Biggest impact: {summary.biggest}
            </div>
            <div className="overflow-x-auto rounded-[2px] border border-white/[0.06]">
              <table className="w-full min-w-[480px] font-mono text-[9px]">
                <thead className="bg-giq-ink3 text-giq-text3">
                  <tr>
                    <th className="p-2 text-left">POS</th>
                    <th className="p-2 text-left">Before</th>
                    <th className="p-2 text-left">After</th>
                    <th className="p-2 text-left">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {NEED_BUCKETS.map((b) => (
                    <tr key={b} className="border-t border-white/[0.04]">
                      <td className="p-2 text-giq-text">{b}</td>
                      <td className="p-2">{Number(base[b] ?? 0).toFixed(1)}</td>
                      <td className="p-2">{adjusted[b].toFixed(1)}</td>
                      <td
                        className="p-2"
                        style={{
                          color: deltas[b] < -0.01 ? "#3ecf7a" : deltas[b] > 0.01 ? "#e05252" : "#9ca3af",
                        }}
                      >
                        {deltas[b] >= 0 ? "+" : ""}
                        {deltas[b].toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3">
              {teamMoves.map((tx) => {
                const badge = moveBadge(tx.type, team, tx);
                const d = deltas[tx.pos as NeedBucket];
                const hasD = tx.pos && NEED_BUCKETS.includes(tx.pos as NeedBucket) && Math.abs(d ?? 0) > 0.01;
                return (
                  <div
                    key={`${tx.date}-${tx.player}`}
                    className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[2px] px-2 py-0.5 font-mono text-[8px] font-bold text-giq-ink" style={{ background: badge.color }}>
                        {badge.label}
                      </span>
                      <span className="font-body text-sm font-semibold text-giq-text">{tx.player}</span>
                      <PosBadge pos={tx.pos} />
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-giq-text3">
                      {tx.from_team ?? "—"} → {tx.to_team ?? "—"}
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-giq-text2">{contractLabel(tx)}</div>
                    {hasD ? (
                      <div className="mt-2 font-mono text-[9px] text-giq-cyan">
                        {tx.pos} need: {Number(base[tx.pos as NeedBucket] ?? 0).toFixed(1)} → {adjusted[tx.pos as NeedBucket].toFixed(1)} ({d >= 0 ? "+" : ""}
                        {d?.toFixed(1)})
                      </div>
                    ) : null}
                    {tx.impact_note ? <p className="mt-2 font-mono text-[9px] leading-relaxed text-giq-text2">{tx.impact_note}</p> : null}
                  </div>
                );
              })}
              {teamMoves.length === 0 ? (
                <div className="font-mono text-[10px] text-giq-text3">No override transactions for {team}.</div>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "DIVISION_WATCH" ? (
          <div className="space-y-4">
            <div className="font-mono text-[10px] text-giq-gold">// DIVISION RIVAL ANALYSIS // NFC SOUTH</div>
            {!divCtx ? (
              <p className="font-mono text-[10px] text-giq-text3">
                Division context JSON is scoped to CAR. Select CAR for full rival grid, or extend division_context.json
                for other clubs.
              </p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  {(divisionContext.division_rivals as string[]).map((rival) => {
                    const row = (divisionContext.division_analysis as Record<string, Record<string, unknown>>)[rival];
                    const signings = txs.filter((t) => t.to_team === rival);
                    const losses = txs.filter((t) => t.from_team === rival);
                    return (
                      <div key={rival} className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3">
                        <div className="font-display text-lg text-giq-gold">{rival}</div>
                        <div className="font-mono text-[8px] text-giq-text3">Pick #{String(row?.draft_pick ?? "?")}</div>
                        <p className="mt-2 font-mono text-[9px] text-giq-text2">{String(row?.offseason_summary ?? "")}</p>
                        <div className="mt-2 font-mono text-[8px] text-giq-text3">SIGNED</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {signings.map((s) => (
                            <span key={s.player} className="rounded-[2px] bg-giq-green/20 px-1.5 py-0.5 font-mono text-[8px] text-giq-green">
                              {s.player}
                            </span>
                          ))}
                          {signings.length === 0 ? <span className="text-giq-text3">—</span> : null}
                        </div>
                        <div className="mt-2 font-mono text-[8px] text-giq-text3">LOST</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {losses.map((s) => (
                            <span
                              key={s.player}
                              className="rounded-[2px] bg-giq-red/15 px-1.5 py-0.5 font-mono text-[8px] text-giq-red/90"
                            >
                              {s.player}
                            </span>
                          ))}
                          {losses.length === 0 ? <span className="text-giq-text3">—</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(row?.needs_created as string[] | undefined)?.map((n) => (
                            <span key={n} className="rounded-[2px] border border-white/[0.08] px-1.5 py-0.5 font-mono text-[8px] text-giq-text">
                              NEED · {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-4">
                  <div className="mb-2 font-mono text-[10px] text-giq-gold">// STRATEGIC INSIGHTS</div>
                  <ul className="space-y-2">
                    {insights.map((line) => (
                      <li key={line} className="flex gap-2 font-mono text-[9px] text-giq-text2">
                        <span className="shrink-0 rounded-[2px] bg-giq-ink3 px-1.5 py-0.5 text-[7px] text-giq-cyan">{insightTag(line)}</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === "NEED_IMPACT" ? (
          <div className="space-y-4">
            <div className="font-mono text-[10px] text-giq-gold">// NEED SCORE COMPARISON // BASE vs ADJUSTED</div>
            <div className="space-y-2">
              {[...NEED_BUCKETS]
                .sort((a, b) => adjusted[b] - adjusted[a])
                .map((b) => {
                  const bv = Number(base[b] ?? 0);
                  const av = adjusted[b];
                  const del = deltas[b];
                  const up = del > 0.05;
                  return (
                    <div key={b} className="grid grid-cols-[48px_1fr_auto] items-center gap-2 font-mono text-[9px]">
                      <span className="text-giq-text2">{b}</span>
                      <div className="relative h-4 rounded-[2px] bg-giq-ink3">
                        <div
                          className="absolute left-0 top-0 h-full rounded-[2px] bg-giq-gold/40"
                          style={{ width: `${bv}%` }}
                        />
                        <div
                          className="absolute left-0 top-0 h-full rounded-[2px] bg-giq-gold"
                          style={{ width: `${av}%`, opacity: up ? 0.85 : 1, background: up ? "#e05252" : undefined }}
                        />
                      </div>
                      <span
                        className="min-w-[52px] rounded-[2px] px-1.5 py-0.5 text-center text-[8px] font-bold text-giq-ink"
                        style={{ background: del < -0.01 ? "#3ecf7a" : del > 0.01 ? "#e05252" : "#3d4f66" }}
                      >
                        {del >= 0 ? "+" : ""}
                        {del.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
            </div>
            <div className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-4">
              <div className="mb-2 font-mono text-[10px] text-giq-gold">// ADJUSTMENT METHODOLOGY</div>
              <pre className="whitespace-pre-wrap font-mono text-[8px] leading-relaxed text-giq-text3">
                {`Need reductions from signings/trades-in scale with contract AAV vs position market rate.
Multi-year deals reduce need more than 1-year bridges. Losses inflate need using the same AAV lens.
Source: transactions_2026.json (override) + nflverse roster signals in the Python pipeline.`}
              </pre>
            </div>
          </div>
        ) : null}

        {tab === "PICK_CHANGES" ? (
          <div className="space-y-4">
            <div className="font-mono text-[10px] text-giq-gold">// PICK CAPITAL CHANGES // 2026 DRAFT</div>
            <div className="overflow-x-auto rounded-[2px] border border-white/[0.06]">
              <table className="w-full font-mono text-[9px]">
                <thead className="bg-giq-ink3 text-giq-text3">
                  <tr>
                    <th className="p-2 text-left">Original</th>
                    <th className="p-2 text-left">Slot</th>
                    <th className="p-2 text-left">Now</th>
                    <th className="p-2 text-left">Reason</th>
                    <th className="p-2 text-left">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {picks.map((p) => (
                    <tr key={`${p.original_team}-${p.pick_slot}`} className="border-t border-white/[0.04]">
                      <td className="p-2 text-giq-text">{p.original_team}</td>
                      <td className="p-2">#{p.pick_slot_approx ?? p.pick_slot ?? "—"}</td>
                      <td className="p-2 text-giq-cyan">{p.now_owned_by}</td>
                      <td className="p-2 text-giq-text2">{p.reason}</td>
                      <td className="p-2 text-giq-text3">{p.draft_order_note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3 font-mono text-[9px] text-giq-text2">
              Supplementary traded-pick ledger from nflreadpy.load_draft_picks() is emitted in the Python pipeline JSON
              (deploy cache). UI shows override rows only.
            </div>
            <p className="font-mono text-[9px] text-giq-text3">
              The Dexter Lawrence trade removes IDL urgency for Cincinnati at picks 10–11. New York trades interior
              depth and pick #10 — at #5 expect EDGE (post-Burns) or OT pressure on the board.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
