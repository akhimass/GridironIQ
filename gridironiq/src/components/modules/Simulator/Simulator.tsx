import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { PosBadge } from "@/components/shared/PosBadge";
import { RankBadge } from "@/components/shared/RankBadge";
import { ScoreBar } from "@/components/shared/ScoreBar";
import { Button } from "@/components/ui/button";
import { PROSPECTS_TOP_40, type Prospect } from "@/data/prospects";
import { DRAFT_ORDER, teamByAbbr, teams } from "@/data/teams";
import {
  computeAdjustedNeedScores,
  topTwoNeedsFromScores,
  type NeedBucket,
  NEED_BUCKETS,
} from "@/lib/offseasonNeeds";
import transactionsBundle from "@/data/offseason/transactions_2026.json";
import { posMatchesNeed } from "@/lib/utils";
import { DraftClock } from "./DraftClock";
import { PickCard } from "./PickCard";
import { ProspectSearch } from "./ProspectSearch";

type Phase = "team-select" | "simulating" | "complete";

type PickRow = { pickNum: number; teamAbbr: string; teamName: string; prospect: Prospect | null };

const TXS = transactionsBundle.transactions ?? [];

function simulatorBaseNeeds(teamAbbr: string): Partial<Record<NeedBucket, number>> {
  const t = teamByAbbr(teamAbbr);
  const m: Partial<Record<NeedBucket, number>> = {};
  for (const b of NEED_BUCKETS) m[b] = 38;
  if (t) {
    m[t.needs[0] as NeedBucket] = 74;
    m[t.needs[1] as NeedBucket] = 70;
  }
  return m;
}

const ADJUSTED_SIM_NEEDS: Record<string, [string, string]> = (() => {
  const out: Record<string, [string, string]> = {};
  for (const tm of teams) {
    const adj = computeAdjustedNeedScores(tm.abbr, simulatorBaseNeeds(tm.abbr), TXS);
    out[tm.abbr] = topTwoNeedsFromScores(adj);
  }
  return out;
})();

function projectPick(teamAbbr: string, available: Set<string>): Prospect[] {
  const t = teamByAbbr(teamAbbr);
  const needs = ADJUSTED_SIM_NEEDS[teamAbbr] ?? t?.needs ?? (["BPA", "BPA"] as [string, string]);
  const pool = PROSPECTS_TOP_40.filter((p) => available.has(p.id));
  const scored = pool.map((p) => {
    let s = (60 - Math.min(p.rank, 60)) * 3 + p.giqScore * 0.8;
    if (posMatchesNeed(p.pos, needs[0])) s += 40;
    if (posMatchesNeed(p.pos, needs[1])) s += 20;
    if (["QB", "EDGE", "OT", "CB", "WR"].includes(p.pos)) s += 10;
    return { ...p, projScore: s };
  });
  return scored.sort((a, b) => b.projScore - a.projScore).slice(0, 3);
}

function initialBoard(): PickRow[] {
  return DRAFT_ORDER.map((abbr, i) => ({
    pickNum: i + 1,
    teamAbbr: abbr,
    teamName: teamByAbbr(abbr)?.name ?? abbr,
    prospect: null,
  }));
}

export default function Simulator() {
  const [phase, setPhase] = useState<Phase>("team-select");
  const [userTeamIdx, setUserTeamIdx] = useState<number | null>(null);
  const [picks, setPicks] = useState<PickRow[]>(() => initialBoard());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [available, setAvailable] = useState(() => new Set(PROSPECTS_TOP_40.map((p) => p.id)));
  const [searchQuery, setSearchQuery] = useState("");
  const [confirming, setConfirming] = useState<Prospect | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [aiPickAtUserTurn, setAiPickAtUserTurn] = useState<Prospect | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const projections = useMemo(() => {
    if (phase !== "simulating") return [] as Prospect[];
    const row = picks[currentIdx];
    if (!row) return [];
    return projectPick(row.teamAbbr, available);
  }, [phase, picks, currentIdx, available]);

  const lockInPick = useCallback((prospect: Prospect, fromIdx: number) => {
    setPicks((prev) => {
      const next = [...prev];
      if (next[fromIdx]) next[fromIdx] = { ...next[fromIdx], prospect };
      return next;
    });
    setAvailable((prev) => {
      const n = new Set(prev);
      n.delete(prospect.id);
      return n;
    });
    setConfirming(null);
    setSearchQuery("");
    if (fromIdx + 1 >= 32) {
      setPhase("complete");
    } else {
      setCurrentIdx(fromIdx + 1);
    }
  }, []);

  useEffect(() => {
    if (phase !== "simulating" || userTeamIdx === null) return;
    if (currentIdx !== userTeamIdx) return;
    const abbr = DRAFT_ORDER[currentIdx];
    const top = projectPick(abbr, available)[0] ?? null;
    setAiPickAtUserTurn(top);
  }, [phase, currentIdx, userTeamIdx, available]);

  useEffect(() => {
    if (phase !== "simulating" || !autoAdvance) return;
    if (userTeamIdx === null) return;
    if (currentIdx >= 32) return;
    if (currentIdx === userTeamIdx) return;
    const top = projections[0];
    if (!top) return;
    const idx = currentIdx;
    const t = window.setTimeout(() => lockInPick(top, idx), 1500);
    return () => clearTimeout(t);
  }, [phase, autoAdvance, userTeamIdx, currentIdx, projections, lockInPick]);

  useEffect(() => {
    scrollRef.current?.querySelector(`[data-pick="${currentIdx + 1}"]`)?.scrollIntoView({ block: "nearest" });
  }, [currentIdx]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PROSPECTS_TOP_40.filter((p) => available.has(p.id)).slice(0, 20);
    return PROSPECTS_TOP_40.filter(
      (p) => available.has(p.id) && (p.name.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [searchQuery, available]);

  const startSim = (idx: number) => {
    setUserTeamIdx(idx);
    setPicks(initialBoard());
    setAvailable(new Set(PROSPECTS_TOP_40.map((p) => p.id)));
    setCurrentIdx(0);
    setPhase("simulating");
  };

  const reset = () => {
    setPhase("team-select");
    setUserTeamIdx(null);
    setPicks(initialBoard());
    setCurrentIdx(0);
    setAvailable(new Set(PROSPECTS_TOP_40.map((p) => p.id)));
    setConfirming(null);
    setSearchQuery("");
  };

  if (phase === "team-select") {
    return (
      <div className="flex flex-1 flex-col bg-giq-ink p-4">
        <ModuleHeader
          title="GRIDIRONIQ DRAFT SIMULATOR // 2026 NFL DRAFT"
          subtitle="SELECT YOUR TEAM — YOU ARE THE GM FOR ROUND 1"
        />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {teams.map((tm, idx) => (
            <PickCard key={tm.abbr} team={tm} onSelect={() => startSim(idx)} />
          ))}
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    const userRow = userTeamIdx != null ? picks[userTeamIdx] : undefined;
    const userPick = userRow?.prospect;
    const aiTop = aiPickAtUserTurn;
    const userTm = userTeamIdx != null ? teamByAbbr(DRAFT_ORDER[userTeamIdx]) : null;
    let gradeMsg = "SOLID_VALUE 👍";
    let gradeColor = "#6496dc";
    if (userPick && aiTop && userPick.id === aiTop.id) {
      gradeMsg = "CONSENSUS_PICK 🎯";
      gradeColor = "#3ecf7a";
    } else if (userPick && aiTop) {
      const diff = userPick.rank - aiTop.rank;
      if (diff > 10) {
        gradeMsg = "REACH ⚠️";
        gradeColor = "#d4a843";
      } else if (diff <= 5) {
        gradeMsg = "SOLID_VALUE 👍";
        gradeColor = "#6496dc";
      }
    }
    const userNeeds = userTm ? ADJUSTED_SIM_NEEDS[userTm.abbr] ?? userTm.needs : null;
    const needHit =
      userPick && userNeeds?.[0] && posMatchesNeed(userPick.pos, userNeeds[0]) ? "NEED_PICK 🔵" : null;
    return (
      <div className="flex flex-1 flex-col bg-giq-ink p-4">
        <ModuleHeader title="ROUND 1 COMPLETE — 2026 NFL DRAFT" />
        <div className="mt-4 rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-4">
          <div className="font-body text-lg font-semibold text-giq-text">
            {userRow?.teamAbbr} selected {userPick?.name ?? "—"} at pick #{userTeamIdx != null ? userTeamIdx + 1 : "—"}
          </div>
          <div className="mt-2 font-mono text-sm" style={{ color: gradeColor }}>
            {gradeMsg}
          </div>
          {aiTop && userPick && userPick.id !== aiTop.id ? (
            <div className="mt-1 font-mono text-[10px] text-giq-text3">AI projected: {aiTop.name}</div>
          ) : null}
          {needHit ? <div className="mt-1 font-mono text-[10px] text-giq-cyan">{needHit}</div> : null}
        </div>
        <div className="mt-4 overflow-auto rounded-[2px] border border-white/[0.06]">
          <table className="w-full font-mono text-[10px]">
            <thead className="bg-giq-ink2 text-giq-text3">
              <tr>
                <th className="p-2">Pick</th>
                <th className="p-2">Team</th>
                <th className="p-2">Prospect</th>
                <th className="p-2">Pos</th>
                <th className="p-2">School</th>
                <th className="p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((r, i) => (
                <tr
                  key={r.pickNum}
                  className={`border-t border-white/[0.03] ${i === userTeamIdx ? "bg-giq-goldDim" : ""}`}
                >
                  <td className="p-2">{r.pickNum}</td>
                  <td className="p-2">{r.teamAbbr}</td>
                  <td className="p-2">{r.prospect?.name ?? "—"}</td>
                  <td className="p-2">{r.prospect?.pos ?? "—"}</td>
                  <td className="p-2">{r.prospect?.school ?? "—"}</td>
                  <td className="p-2">{r.prospect?.giqScore?.toFixed(1) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="gold" className="mt-4 self-start" onClick={reset}>
          START_NEW_DRAFT
        </Button>
      </div>
    );
  }

  const row = picks[currentIdx];
  const isUser = userTeamIdx !== null && currentIdx === userTeamIdx;
  const tm = row ? teamByAbbr(row.teamAbbr) : null;

  return (
    <div className="flex flex-1 flex-col bg-giq-ink">
      <ModuleHeader title={`PICK ${currentIdx + 1} — ${row?.teamName ?? ""}`} />
      <div className="grid flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-10">
        <div ref={scrollRef} className="lg:col-span-3">
          <div className="mb-2 font-mono text-[10px] text-giq-gold">ROUND 1 BOARD</div>
          <div className="max-h-[70vh] overflow-auto rounded-[2px] border border-white/[0.06] bg-giq-ink2">
            {picks.map((r, i) => {
              const past = i < currentIdx;
              const cur = i === currentIdx;
              const userFuture = userTeamIdx != null && i > currentIdx && i === userTeamIdx && !r.prospect;
              const userDone = userTeamIdx != null && i === userTeamIdx && !!r.prospect && i < currentIdx;
              return (
                <div
                  key={r.pickNum}
                  data-pick={r.pickNum}
                  className={`flex items-center gap-2 border-b border-white/[0.03] px-2 py-1 font-mono text-[10px] ${
                    past && !userDone ? "text-giq-text3" : ""
                  } ${cur && !userDone ? "bg-giq-goldDim text-giq-ink" : ""} ${userFuture ? "border-l-2 border-l-giq-gold" : ""} ${
                    userDone ? "bg-giq-gold text-giq-ink" : ""
                  }`}
                >
                  {past ? "✓" : ""}
                  {cur ? (
                    <span className="animate-pulse rounded-[2px] bg-giq-ink px-1 text-[8px] text-giq-gold">ON_CLOCK</span>
                  ) : null}
                  <span>{r.pickNum}</span>
                  <span>{r.teamAbbr}</span>
                  <span className="truncate">{r.prospect ? `${r.prospect.name} (${r.prospect.pos})` : "—"}</span>
                  {userDone ? <span>★</span> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`lg:col-span-7 rounded-[2px] border p-3 ${
            isUser ? "border-giq-gold bg-giq-ink2" : "border-white/[0.06] bg-giq-ink2"
          }`}
        >
          {tm ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {tm.needs.map((n) => (
                <PosBadge key={n} pos={n} />
              ))}
            </div>
          ) : null}

          {!isUser ? (
            <>
              <div className="font-mono text-[10px] text-giq-text3">PROJECTED_PICKS</div>
              <div className="mt-2 space-y-2">
                {projections.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-[2px] border border-white/[0.06] p-2">
                    <RankBadge rank={p.rank} />
                    {i === 0 ? (
                      <span className="rounded-[2px] bg-giq-goldDim px-1 font-mono text-[8px] text-giq-gold">AI_PICK</span>
                    ) : null}
                    <div className="flex-1">
                      <div className="font-body text-sm font-semibold">{p.name}</div>
                      <div className="font-mono text-[9px] text-giq-text3">
                        {p.pos} · {p.school}
                      </div>
                    </div>
                    <ScoreBar score={p.giqScore} maxWidth={48} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" onClick={() => projections[0] && lockInPick(projections[0], currentIdx)}>
                  AUTO_PICK
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const snapIdx = currentIdx;
                    const snapTop = projections[0];
                    if (!snapTop) return;
                    let left = 3;
                    setCountdown(3);
                    const iv = window.setInterval(() => {
                      left -= 1;
                      if (left <= 0) {
                        clearInterval(iv);
                        setCountdown(null);
                        lockInPick(snapTop, snapIdx);
                      } else {
                        setCountdown(left);
                      }
                    }, 1000);
                  }}
                >
                  SET_TIMER
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAutoAdvance((a) => !a)}>
                  AUTO_ADV: {autoAdvance ? "ON" : "OFF"}
                </Button>
              </div>
              <DraftClock value={countdown} />
            </>
          ) : (
            <>
              <div className="mb-2 inline-block rounded-[2px] bg-giq-goldDim px-2 font-mono text-[10px] text-giq-gold">
                YOUR_PICK
              </div>
              <ProspectSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                results={searchResults}
                needTop={tm?.needs[0]}
                onPick={(p) => setConfirming(p)}
              />

              {confirming ? (
                <div className="relative mt-4 rounded-[2px] border border-giq-gold bg-giq-ink3 p-4">
                  <div className="font-display text-2xl text-giq-gold">{confirming.name}</div>
                  <div className="font-mono text-[10px] text-giq-text2">
                    {confirming.pos} · {confirming.school}
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 font-mono text-[9px] text-giq-text3">
                    <div>RANK {confirming.rank}</div>
                    <div>SCORE {confirming.giqScore}</div>
                    <div>40 {confirming.forty ?? "—"}</div>
                    <div>WT {confirming.weight}</div>
                  </div>
                  <p className="mt-2 font-mono text-[9px] text-giq-text2">{confirming.notes}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="gold" onClick={() => lockInPick(confirming, currentIdx)}>
                      ✓ CONFIRM_PICK
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirming(null)}>
                      ← BACK
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
