import { useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { PosBadge } from "@/components/shared/PosBadge";
import { PROSPECTS, prospectById, type Prospect } from "@/data/prospects";
import { CompareRow } from "./CompareRow";

function seasonTds(p: Prospect) {
  return p.stats.receivingTds ?? p.stats.rushingTds ?? p.stats.passingTds ?? 0;
}

function seasonYds(p: Prospect) {
  return (
    p.stats.receivingYds ??
    p.stats.rushingYds ??
    p.stats.passingYds ??
    p.stats.receivingRec ??
    0
  );
}

export default function Compare({ seedPlayerAId }: { seedPlayerAId?: string | null }) {
  const defA = prospectById("jeremiyah-love");
  const defB = prospectById("dylan-sampson");
  const [playerA, setPlayerA] = useState<Prospect | null>(defA ?? null);
  const [playerB, setPlayerB] = useState<Prospect | null>(defB ?? null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  useEffect(() => {
    if (!seedPlayerAId) return;
    const p = prospectById(seedPlayerAId);
    if (p) setPlayerA(p);
  }, [seedPlayerAId]);

  const listA = useMemo(() => {
    const q = searchA.trim().toLowerCase();
    if (!q) return PROSPECTS.slice(0, 12);
    return PROSPECTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12);
  }, [searchA]);

  const listB = useMemo(() => {
    const q = searchB.trim().toLowerCase();
    if (!q) return PROSPECTS.slice(0, 12);
    return PROSPECTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12);
  }, [searchB]);

  const winner =
    playerA && playerB
      ? playerA.giqScore >= playerB.giqScore
        ? playerA.name
        : playerB.name
      : "—";

  const expl =
    playerA && playerB
      ? playerA.giqScore >= playerB.giqScore
        ? `${playerA.name} leads composite GIQ and R1 probability profile.`
        : `${playerB.name} leads composite GIQ and R1 probability profile.`
      : "";

  if (!playerA || !playerB) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader title="COMPARE_ENGINE // HEAD-TO-HEAD" />
      <div className="grid flex-1 grid-cols-1 gap-2 p-4 lg:grid-cols-[1fr_auto_1fr]">
        <div>
          <input
            value={searchA}
            onChange={(e) => setSearchA(e.target.value)}
            placeholder="SEARCH_PLAYER_A..."
            className="mb-2 w-full rounded-[2px] border border-white/[0.06] bg-giq-ink2 px-2 py-2 font-mono text-[10px]"
          />
          <div className="max-h-32 space-y-1 overflow-auto">
            {listA.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlayerA(p)}
                className="block w-full rounded-[2px] border border-white/[0.06] px-2 py-1 text-left font-mono text-[9px] text-giq-text2 hover:bg-giq-ink3"
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="mt-4 font-display text-[28px] leading-tight text-giq-text">{playerA.name}</div>
          <div className="mt-1 flex items-center gap-2">
            <PosBadge pos={playerA.pos} />
            <span className="font-mono text-[10px] text-giq-text3">{playerA.school}</span>
          </div>
        </div>

        <div className="flex items-center justify-center px-2">
          <div className="font-display text-3xl text-giq-gold">VS</div>
        </div>

        <div>
          <input
            value={searchB}
            onChange={(e) => setSearchB(e.target.value)}
            placeholder="SEARCH_PLAYER_B..."
            className="mb-2 w-full rounded-[2px] border border-white/[0.06] bg-giq-ink2 px-2 py-2 font-mono text-[10px]"
          />
          <div className="max-h-32 space-y-1 overflow-auto">
            {listB.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlayerB(p)}
                className="block w-full rounded-[2px] border border-white/[0.06] px-2 py-1 text-left font-mono text-[9px] text-giq-text2 hover:bg-giq-ink3"
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="mt-4 font-display text-[28px] leading-tight text-giq-text">{playerB.name}</div>
          <div className="mt-1 flex items-center gap-2">
            <PosBadge pos={playerB.pos} />
            <span className="font-mono text-[10px] text-giq-text3">{playerB.school}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-4 pb-6">
        <CompareRow
          label="GIQ_SCORE"
          a={playerA.giqScore}
          b={playerB.giqScore}
          aWin={playerA.giqScore > playerB.giqScore}
          bWin={playerB.giqScore > playerA.giqScore}
          fmt={(v) => (typeof v === "number" ? v.toFixed(1) : String(v))}
        />
        <CompareRow
          label="R1_PROB"
          a={playerA.r1Prob}
          b={playerB.r1Prob}
          aWin={playerA.r1Prob > playerB.r1Prob}
          bWin={playerB.r1Prob > playerA.r1Prob}
          fmt={(v) => (typeof v === "number" ? `${Math.round(v * 100)}%` : String(v))}
        />
        <CompareRow
          label="ATHLETICISM"
          a={playerA.athleticism}
          b={playerB.athleticism}
          aWin={playerA.athleticism > playerB.athleticism}
          bWin={playerB.athleticism > playerA.athleticism}
        />
        <CompareRow
          label="PRODUCTION"
          a={playerA.production}
          b={playerB.production}
          aWin={playerA.production > playerB.production}
          bWin={playerB.production > playerA.production}
        />
        <CompareRow
          label="SCHEME_FIT"
          a={playerA.schemeFit}
          b={playerB.schemeFit}
          aWin={playerA.schemeFit > playerB.schemeFit}
          bWin={playerB.schemeFit > playerA.schemeFit}
        />
        <CompareRow
          label="FORTY"
          a={playerA.forty ?? "—"}
          b={playerB.forty ?? "—"}
          aWin={!!playerA.forty && !!playerB.forty && playerA.forty < playerB.forty}
          bWin={!!playerA.forty && !!playerB.forty && playerB.forty < playerA.forty}
        />
        <CompareRow
          label="VERTICAL"
          a={playerA.vertical ?? "—"}
          b={playerB.vertical ?? "—"}
          aWin={
            typeof playerA.vertical === "number" &&
            typeof playerB.vertical === "number" &&
            playerA.vertical > playerB.vertical
          }
          bWin={
            typeof playerA.vertical === "number" &&
            typeof playerB.vertical === "number" &&
            playerB.vertical > playerA.vertical
          }
        />
        <CompareRow
          label="WEIGHT"
          a={playerA.weight}
          b={playerB.weight}
          aWin={playerA.weight > playerB.weight}
          bWin={playerB.weight > playerA.weight}
        />
        <CompareRow
          label="SEASON_TDs"
          a={seasonTds(playerA)}
          b={seasonTds(playerB)}
          aWin={seasonTds(playerA) > seasonTds(playerB)}
          bWin={seasonTds(playerB) > seasonTds(playerA)}
        />
        <CompareRow
          label="SEASON_YDS"
          a={seasonYds(playerA)}
          b={seasonYds(playerB)}
          aWin={seasonYds(playerA) > seasonYds(playerB)}
          bWin={seasonYds(playerB) > seasonYds(playerA)}
        />
      </div>

      <div className="mx-4 mb-6 rounded-[2px] border border-giq-gold bg-giq-goldDim p-4">
        <div className="font-mono text-[10px] text-giq-gold">EDGE</div>
        <div className="font-mono text-sm text-giq-gold2">{winner}</div>
        <div className="mt-1 font-mono text-[10px] text-giq-text2">{expl}</div>
      </div>
    </div>
  );
}
