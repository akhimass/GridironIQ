import divisionContext from "@/data/offseason/division_context.json";
import transactionsBundle from "@/data/offseason/transactions_2026.json";

type TxBundle = {
  transactions?: OffseasonTx[];
  pick_changes?: PickChangeRow[];
  sources?: string[];
  net_need_adjustments_by_team?: Record<string, Record<string, number>>;
};

const bundle = transactionsBundle as unknown as TxBundle;

export type NeedBucket =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "OT"
  | "IOL"
  | "EDGE"
  | "IDL"
  | "LB"
  | "CB"
  | "SAF";

export const NEED_BUCKETS: NeedBucket[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "OT",
  "IOL",
  "EDGE",
  "IDL",
  "LB",
  "CB",
  "SAF",
];

export type OffseasonTx = {
  type: string;
  date?: string;
  player: string;
  pos: string;
  pos_bucket?: string | null;
  from_team?: string | null;
  to_team?: string | null;
  contract?: { years?: number; aav?: number; guaranteed?: number } | null;
  impact_note?: string;
  draft_need_impact?: Record<string, Record<string, number>> | null;
};

export type PickChangeRow = {
  date?: string;
  original_team: string;
  pick_round?: number;
  pick_slot?: number;
  pick_slot_approx?: number | null;
  now_owned_by: string;
  reason: string;
  draft_order_note?: string;
};

function clip(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function computeNeedReduction(aav: number, years: number, pos: string): number {
  const marketStarter: Record<string, number> = {
    QB: 40_000_000,
    EDGE: 22_000_000,
    OT: 18_000_000,
    WR: 18_000_000,
    TE: 12_000_000,
    CB: 15_000_000,
    SAF: 10_000_000,
    LB: 12_000_000,
    IDL: 15_000_000,
    IOL: 14_000_000,
    RB: 8_000_000,
  };
  let a = aav;
  if (a === 0) a = marketStarter[pos] ?? 10_000_000;
  const market = marketStarter[pos] ?? 10_000_000;
  const qualityRatio = Math.min(a / market, 2);
  const commitmentMult = years <= 1 ? 1.0 : years === 2 ? 1.2 : 1.4;
  let reduction = qualityRatio * commitmentMult * 20.0;
  if (years === 1) reduction *= 0.5;
  return clip(reduction, 2, 40);
}

function normalizeImpactKey(key: string): NeedBucket | null {
  const k = key.trim().toUpperCase();
  if (!k || k.startsWith("_")) return null;
  const alias: Record<string, NeedBucket> = {
    S: "SAF",
    SS: "SAF",
    FS: "SAF",
    DB: "SAF",
    DT: "IDL",
    NT: "IDL",
    DE: "EDGE",
    T: "OT",
    G: "IOL",
    C: "IOL",
  };
  const m = (alias[k] ?? k) as string;
  if (m === "ST" || m === "LS" || m === "UNK") return null;
  return NEED_BUCKETS.includes(m as NeedBucket) ? (m as NeedBucket) : null;
}

function sumRowImpacts(txList: OffseasonTx[], teamU: string): Partial<Record<NeedBucket, number>> {
  const d: Partial<Record<NeedBucket, number>> = {};
  for (const t of txList) {
    const di = t.draft_need_impact;
    if (!di || typeof di !== "object") continue;
    const inner = di[teamU];
    if (!inner || typeof inner !== "object") continue;
    for (const [pk, dv] of Object.entries(inner)) {
      const nb = normalizeImpactKey(pk);
      if (!nb) continue;
      d[nb] = (d[nb] ?? 0) + Number(dv);
    }
  }
  return d;
}

function netRow(teamU: string): Partial<Record<NeedBucket, number>> {
  const net = bundle.net_need_adjustments_by_team;
  if (!net || typeof net !== "object") return {};
  const row = net[teamU];
  if (!row || typeof row !== "object") return {};
  const d: Partial<Record<NeedBucket, number>> = {};
  for (const [pk, dv] of Object.entries(row)) {
    if (pk.startsWith("_")) continue;
    const nb = normalizeImpactKey(pk);
    if (!nb) continue;
    d[nb] = (d[nb] ?? 0) + Number(dv);
  }
  return d;
}

function legacyAdjust(
  adjusted: Record<NeedBucket, number>,
  teamU: string,
  txList: OffseasonTx[],
): Record<NeedBucket, number> {
  const teamMoves = txList.filter((t) => t.to_team === teamU || t.from_team === teamU);
  for (const move of teamMoves) {
    const rawPos = (move.pos_bucket || move.pos || "") as string;
    const pos = rawPos as NeedBucket | string;
    if (!NEED_BUCKETS.includes(pos as NeedBucket) || pos === "UNK") continue;
    const pb = pos as NeedBucket;
    const c = move.contract;
    const aav = Number(c?.aav ?? 0);
    const years = Number(c?.years ?? 0);
    const mtype = move.type.toLowerCase();
    if (mtype === "trade_cancelled" || mtype === "waived") continue;
    if (move.draft_need_impact && Object.keys(move.draft_need_impact).length) continue;
    if (move.to_team === teamU) {
      adjusted[pb] = clip(adjusted[pb] - computeNeedReduction(aav, years, pb), 0, 100);
    } else if (move.from_team === teamU) {
      adjusted[pb] = clip(adjusted[pb] + computeNeedIncrease(aav, pb), 0, 100);
    }
  }
  return adjusted;
}

function computeNeedIncrease(aav: number, pos: string): number {
  if (aav === 0) return 10;
  const marketStarter: Record<string, number> = {
    QB: 40_000_000,
    EDGE: 22_000_000,
    OT: 18_000_000,
    WR: 18_000_000,
    TE: 12_000_000,
    CB: 15_000_000,
    SAF: 10_000_000,
    LB: 12_000_000,
    IDL: 15_000_000,
    IOL: 14_000_000,
    RB: 8_000_000,
  };
  const market = marketStarter[pos] ?? 10_000_000;
  const qualityRatio = Math.min(aav / market, 2);
  return clip(qualityRatio * 18.0, 5, 35);
}

export function computeAdjustedNeedScores(
  team: string,
  base: Partial<Record<NeedBucket, number>>,
  txs: OffseasonTx[] = (bundle.transactions ?? []) as OffseasonTx[],
): Record<NeedBucket, number> {
  const teamU = team.toUpperCase();
  const adjusted = Object.fromEntries(
    NEED_BUCKETS.map((b) => [b, clip(Number(base[b] ?? 0), 0, 100)]),
  ) as Record<NeedBucket, number>;

  const rowSum = sumRowImpacts(txs, teamU);
  const rowMag = NEED_BUCKETS.reduce((a, b) => a + Math.abs(rowSum[b] ?? 0), 0);
  if (rowMag > 1e-6) {
    for (const b of NEED_BUCKETS) {
      adjusted[b] = clip(adjusted[b] + (rowSum[b] ?? 0), 0, 100);
    }
    return adjusted;
  }

  const netD = netRow(teamU);
  const netMag = NEED_BUCKETS.reduce((a, b) => a + Math.abs(netD[b] ?? 0), 0);
  if (netMag > 1e-6) {
    for (const b of NEED_BUCKETS) {
      adjusted[b] = clip(adjusted[b] + (netD[b] ?? 0), 0, 100);
    }
    return adjusted;
  }

  return legacyAdjust(adjusted, teamU, txs);
}

export function transactionSources(): string[] {
  return Array.isArray(bundle.sources) ? [...bundle.sources] : [];
}

export function needDeltas(
  base: Partial<Record<NeedBucket, number>>,
  adjusted: Record<NeedBucket, number>,
): Record<NeedBucket, number> {
  return Object.fromEntries(
    NEED_BUCKETS.map((b) => [b, Math.round((adjusted[b] - Number(base[b] ?? 0)) * 100) / 100]),
  ) as Record<NeedBucket, number>;
}

export function movesForTeam(team: string, txs: OffseasonTx[] = (bundle.transactions ?? []) as OffseasonTx[]) {
  const u = team.toUpperCase();
  return txs.filter((t) => t.to_team === u || t.from_team === u);
}

export function pickChanges(): PickChangeRow[] {
  return (bundle.pick_changes ?? []) as PickChangeRow[];
}

export function divisionContextForTeam(team: string) {
  if ((divisionContext.team as string).toUpperCase() !== team.toUpperCase()) return null;
  return divisionContext;
}

export function strategicInsights(team: string): string[] {
  const ctx = divisionContextForTeam(team);
  if (!ctx) return [];
  const insights: string[] = [];
  const gaps = ctx.division_gaps ?? {};
  const hasNo: string[] = (gaps.division_has_no as string[]) ?? [];
  if (hasNo.includes("elite_TE")) {
    insights.push(
      `No NFC South team has an elite receiving TE. Drafting a premium TE creates a structural mismatch vs all 3 division rivals for ${team}.`,
    );
  }
  if (hasNo.includes("elite_pass_rush")) {
    insights.push(
      `Pass rush is weak division-wide. Adding an elite EDGE alongside a marquee signing can give ${team} the best pass rush in the NFC South.`,
    );
  }
  const rivals = (ctx.division_rivals as string[]) ?? [];
  const analysis = (ctx.division_analysis ?? {}) as Record<
    string,
    { needs_created?: string[]; draft_pick?: number }
  >;
  for (const rival of rivals) {
    const row = analysis[rival];
    const rem = row?.needs_created ?? [];
    if (rem.length) {
      insights.push(
        `${rival} still needs ${rem.join(", ")} — expect board overlap with ${team} near pick ${row?.draft_pick ?? "?"}.`,
      );
    }
  }
  return insights;
}

/** Top two need buckets by adjusted score (for simulator projections). */
export function topTwoNeedsFromScores(scores: Record<NeedBucket, number>): [string, string] {
  const sorted = [...NEED_BUCKETS].sort((a, b) => scores[b] - scores[a]);
  return [sorted[0]!, sorted[1]!];
}
