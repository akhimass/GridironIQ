import type { InjuryRisk } from "@/lib/injuryRisk";
import { injuryRiskForProspect } from "@/lib/injuryRisk";
import { giqToSISGrade } from "@/lib/sisGrading";
import { getProspectTraits, type ProspectTraits } from "@/lib/traitGrades";

export type ProspectPos = "QB" | "WR" | "RB" | "TE" | "EDGE" | "OT" | "IOL" | "CB" | "S" | "LB" | "IDL";

export type Prospect = {
  id: string;
  rank: number;
  name: string;
  pos: ProspectPos;
  school: string;
  conf: string;
  height: string;
  weight: number;
  forty: number | null;
  vertical: number | null;
  broadJump: number | null;
  bench: number | null;
  giqScore: number;
  athleticism: number;
  production: number;
  efficiency: number;
  schemeFit: number;
  teamNeed: number;
  r1Prob: number;
  grade: string;
  notes: string;
  stats: {
    passingYds?: number;
    passingTds?: number;
    completionPct?: number;
    rushingYds?: number;
    rushingTds?: number;
    receivingRec?: number;
    receivingYds?: number;
    receivingTds?: number;
    sacks?: number;
  };
  /** SIS-style 1–9 overall (from GIQ calibration). */
  sisGrade: number;
  sisRole: string;
  sisTier: string;
  roundProj: string;
  injuryRisk: InjuryRisk;
  traits: ProspectTraits;
};

function n(
  id: string,
  rank: number,
  name: string,
  pos: ProspectPos,
  school: string,
  conf: string,
  height: string,
  weight: number,
  forty: number | null,
  vertical: number | null,
  broadJump: number | null,
  bench: number | null,
  giqScore: number,
  athleticism: number,
  production: number,
  efficiency: number,
  schemeFit: number,
  teamNeed: number,
  r1Prob: number,
  grade: string,
  notes: string,
  stats: Prospect["stats"] = {}
): Prospect {
  const sis = giqToSISGrade(giqScore, pos);
  const traits = getProspectTraits(id, pos, giqScore, athleticism, production, efficiency);
  return {
    id,
    rank,
    name,
    pos,
    school,
    conf,
    height,
    weight,
    forty,
    vertical,
    broadJump,
    bench,
    giqScore,
    athleticism,
    production,
    efficiency,
    schemeFit,
    teamNeed,
    r1Prob,
    grade,
    notes,
    stats,
    sisGrade: sis.grade,
    sisRole: sis.label,
    sisTier: sis.tier,
    roundProj: sis.roundProj,
    injuryRisk: injuryRiskForProspect(id),
    traits,
  };
}

/** Hardcoded 2026 class — CAR ``teamNeed`` from pipeline-style priors */
export const PROSPECTS: Prospect[] = [
  n("fernando-mendoza", 1, "Fernando Mendoza", "QB", "Indiana", "B10", "6-4", 225, null, null, null, null, 96.3, 78, 94, 88, 62, 62, 0.99, "A+", "Heisman winner, 72.0% completion, 3,535 yds, 41 TD, 6 INT", {
    completionPct: 72,
    passingYds: 3535,
    passingTds: 41,
  }),
  n("arvell-reese", 2, "Arvell Reese", "EDGE", "Ohio State", "SEC", "6-2", 248, 4.5, 33, 118, 24, 94.1, 91, 82, 86, 73, 73, 0.98, "A+", "6.5 sacks, 46 pressures, hybrid LB/EDGE, sideline range", { sacks: 6.5 }),
  n("francis-mauigoa", 3, "Francis Mauigoa", "OT", "Miami", "ACC", "6-6", 336, 5.08, 28, 102, 22, 91.8, 72, 70, 74, 64, 64, 0.97, "A", "OT1 consensus, 3-year starter, elite run-blocking force"),
  n("jeremiyah-love", 4, "Jeremiyah Love", "RB", "Notre Dame", "IND", "5-10", 210, 4.43, 36, 124, 18, 87.2, 92, 88, 84, 63, 63, 0.96, "A", "1,372 rush yds, 18 TD, 64 rec — elite 3-down back", {
    rushingYds: 1372,
    rushingTds: 18,
    receivingRec: 64,
  }),
  n("caleb-downs", 5, "Caleb Downs", "S", "Ohio State", "SEC", "6-0", 206, 4.45, 38, 128, 16, 91.0, 90, 80, 88, 65, 65, 0.95, "A", "Jim Thorpe Award, All-American, team captain — comp: Budda Baker"),
  n("makai-lemon", 6, "Makai Lemon", "WR", "USC", "B12", "5-11", 191, 4.43, 38, 122, 14, 89.4, 93, 86, 85, 67, 67, 0.94, "A", "1,156 rec yds, 11 TD, slot master — comp: Amon-Ra St. Brown", {
    receivingYds: 1156,
    receivingTds: 11,
    receivingRec: 82,
  }),
  n("sonny-styles", 7, "Sonny Styles", "LB", "Ohio State", "SEC", "6-4", 244, 4.52, 35, 118, 26, 84.1, 88, 76, 82, 100, 100, 0.91, "A-", "21.5 TFL over 3 seasons, elite coverage LB"),
  n("david-bailey", 8, "David Bailey", "EDGE", "Texas Tech", "B12", "6-5", 258, 4.5, 32, 116, 22, 86.9, 89, 84, 83, 73, 73, 0.93, "A", "14.5 sacks (FBS co-leader), 6'5\", 33.75\" arms", { sacks: 14.5 }),
  n("kenyon-sadiq", 9, "Kenyon Sadiq", "TE", "Oregon", "B12", "6-4", 241, 4.39, 40, 130, 20, 88.7, 95, 82, 80, 77, 77, 0.92, "A", "4.39 all-time TE combine record, 51 rec/560 yds/8 TD", {
    receivingYds: 560,
    receivingTds: 8,
    receivingRec: 51,
  }),
  n("mansoor-delane", 10, "Mansoor Delane", "CB", "LSU", "SEC", "6-0", 192, 4.38, 39, 126, 15, 85.0, 91, 74, 86, 77, 77, 0.86, "A-", "10 completions/119 yds allowed all season, CB1 unanimous"),
  n("carnell-tate", 11, "Carnell Tate", "WR", "Ohio State", "SEC", "6-2", 195, 4.48, 36, 120, 14, 85.3, 88, 80, 82, 67, 67, 0.91, "A-", "Zero drops 2025, 51 rec/875 yds/9 TD", {
    receivingYds: 875,
    receivingTds: 9,
    receivingRec: 51,
  }),
  n("jordyn-tyson", 12, "Jordyn Tyson", "WR", "Arizona State", "B12", "6-2", 198, 4.4, 38, 124, 12, 86.1, 92, 83, 84, 67, 67, 0.84, "A-", "Biletnikoff Award winner, elite contested catch 6'2\""),
  n("monroe-freeling", 13, "Monroe Freeling", "OT", "Georgia", "SEC", "6-7", 312, 5.05, 30, 108, 24, 81.4, 74, 68, 72, 64, 64, 0.79, "B+", "OT2 consensus, high ceiling, 18 college starts"),
  n("olaivavega-ioane", 14, "Olaivavega Ioane", "IOL", "Penn State", "B10", "6-5", 336, null, 28, 102, 32, 80.2, 68, 72, 70, 73, 73, 0.77, "B+", "Played LG, C, RG — rare interior versatility"),
  n("jermod-mccoy", 15, "Jermod McCoy", "CB", "Tennessee", "SEC", "6-0", 188, 4.41, 37, 122, 14, 80.0, 90, 70, 84, 77, 77, 0.74, "B+", "Missed 2025 knee injury, legitimate CB1 when healthy"),
  n("kadyn-proctor", 16, "Kadyn Proctor", "OT", "Alabama", "SEC", "6-7", 352, 5.1, 27, 100, 22, 79.8, 70, 66, 70, 64, 64, 0.72, "B+", "6'7\" 352 lbs, mammoth frame, 40 career starts"),
  n("akheem-mesidor", 17, "Akheem Mesidor", "EDGE", "Miami", "ACC", "6-3", 262, 4.65, 32, 112, 24, 76.0, 82, 80, 78, 73, 73, 0.71, "B+", "12.5 sacks 2025, polished pass rush, age 25 draft day", {
    sacks: 12.5,
  }),
  n("spencer-fano", 18, "Spencer Fano", "OT", "Utah", "B12", "6-6", 311, 4.91, 31, 110, 28, 86.1, 76, 74, 76, 64, 64, 0.7, "B+", "Outland Trophy, all 5 OL spots, 4.91 speed elite for position"),
  n("dillon-thieneman", 19, "Dillon Thieneman", "S", "Oregon", "B12", "6-1", 201, 4.35, 40, 128, 18, 74.8, 88, 76, 82, 65, 65, 0.68, "B+", "300+ career tackles, 8 INTs, 4.35 speed, S2 consensus"),
  n("emmanuel-mcneil-warren", 20, "Emmanuel McNeil-Warren", "S", "Toledo", "MAC", "6-0", 201, 4.52, 35, 118, 16, 69.9, 84, 78, 80, 65, 65, 0.65, "B", "PFF #1 coverage safety 2025 (92.0 grade), 9 career FF"),
  n("avieon-terrell", 21, "Avieon Terrell", "CB", "Clemson", "ACC", "5-11", 187, 4.63, 34, 116, 12, 69.2, 86, 72, 78, 77, 77, 0.61, "B", "Elite IQ, zone specialist, mid-4.6 pro day concern"),
  n("denzel-boston", 22, "Denzel Boston", "WR", "Washington", "B12", "6-3", 205, 4.44, 36, 120, 14, 68.8, 87, 79, 80, 67, 67, 0.59, "B", "6'3\" boundary WR, contested catch specialist", {
    receivingYds: 980,
    receivingTds: 8,
  }),
  n("omar-cooper-jr", 23, "Omar Cooper Jr.", "WR", "Indiana", "B10", "6-1", 215, 4.48, 35, 118, 15, 68.4, 85, 81, 78, 67, 67, 0.57, "B", "13 TD 2025, dense frame, slot-to-boundary versatility", {
    receivingTds: 13,
  }),
  n("keldric-faulk", 24, "Keldric Faulk", "EDGE", "Auburn", "SEC", "6-6", 262, 4.68, 30, 108, 22, 67.1, 80, 74, 76, 73, 73, 0.54, "B", "6'6\", 32\" arms, high-motor developmental pass rusher"),
  n("kayden-mcdonald", 25, "Kayden McDonald", "IDL", "Ohio State", "SEC", "6-3", 316, 4.93, 29, 104, 30, 66.9, 72, 76, 74, 78, 78, 0.52, "B", "Interior disruptor, top-30 visits, OSU pipeline"),
  n("peter-woods", 26, "Peter Woods", "IDL", "Clemson", "ACC", "6-2", 299, null, 31, 106, 28, 65.8, 70, 72, 72, 78, 78, 0.5, "B", "3-tech pass rusher, excellent get-off, stock down 2025"),
  n("caleb-lomu", 27, "Caleb Lomu", "OT", "Utah", "B12", "6-5", 328, 5.15, 28, 102, 26, 65.2, 68, 66, 70, 64, 64, 0.48, "B-", "Utah's 2nd R1 OT, powerful run blocker"),
  n("zion-young", 28, "Zion Young", "EDGE", "Missouri", "SEC", "6-3", 255, 4.62, 33, 114, 24, 64.4, 84, 77, 76, 73, 73, 0.46, "B-", "Motor and effort standout, 6.5 sacks + 46 pressures 2025"),
  n("cashius-howell", 29, "Cashius Howell", "EDGE", "Texas A&M", "SEC", "6-3", 248, 4.58, 32, 112, 22, 63.8, 86, 79, 78, 73, 73, 0.44, "B-", "Led SEC 11.5 sacks, twitchy first step, multiple R1 mocks", {
    sacks: 11.5,
  }),
  n("kc-concepcion", 30, "KC Concepcion", "WR", "Texas A&M", "SEC", "5-10", 188, 4.41, 37, 120, 12, 62.1, 89, 78, 80, 67, 67, 0.41, "B-", "Slot-first, 13 TD upside, Jeremiah mocked to CAR", {
    receivingTds: 13,
  }),
  n("ty-simpson", 31, "Ty Simpson", "QB", "Alabama", "SEC", "6-2", 215, 4.58, 34, 118, null, 72.0, 80, 76, 78, 62, 62, 0.42, "B+", "Tools + Bama pedigree, limited starts, high ceiling"),
  n("garrett-nussmeier", 32, "Garrett Nussmeier", "QB", "LSU", "SEC", "6-2", 220, 4.72, 33, 112, null, 71.2, 78, 80, 80, 62, 62, 0.4, "B+", "Arm talent, turnover discipline improving"),
  n("chase-bisontis", 33, "Chase Bisontis", "IOL", "Texas A&M", "SEC", "6-6", 325, 5.02, 28, 104, 32, 70.5, 72, 70, 72, 73, 73, 0.38, "B+", "Power guard, A&M OL factory"),
  n("anthony-hill", 34, "Anthony Hill", "LB", "Texas", "SEC", "6-2", 240, 4.55, 36, 120, 26, 73.2, 88, 74, 80, 100, 100, 0.36, "B+", "Sideline-to-sideline, coverage upside"),
  n("eli-stowers", 35, "Eli Stowers", "TE", "Georgia", "SEC", "6-5", 250, 4.65, 34, 110, 22, 68.0, 78, 72, 74, 77, 77, 0.34, "B", "Move TE, red-zone weapon"),
  n("brandon-cisse", 36, "Brandon Cisse", "CB", "Texas Tech", "B12", "6-0", 190, 4.46, 37, 122, 14, 67.5, 87, 70, 78, 77, 77, 0.33, "B", "Length + recovery speed"),
  n("cj-allen", 37, "CJ Allen", "LB", "Georgia", "SEC", "6-1", 235, 4.6, 35, 116, 24, 72.8, 86, 76, 80, 100, 100, 0.32, "B+", "Instincts, SEC champion"),
  n("jacob-rodriguez", 38, "Jacob Rodriguez", "LB", "Texas Tech", "B12", "6-1", 242, 4.39, 38, 128, 28, 96.3, 94, 78, 84, 100, 100, 0.31, "A", "Elite combine, production profile vs G5 context"),
  n("dani-dennis-sutton", 39, "Dani Dennis-Sutton", "EDGE", "Penn State", "B10", "6-5", 265, 4.55, 33, 114, 26, 75.0, 86, 77, 80, 73, 73, 0.3, "B+", "Length + burst, PSU development"),
  n("kyle-louis", 40, "Kyle Louis", "LB", "USC", "B12", "6-2", 238, 4.52, 36, 118, 26, 94.4, 90, 75, 82, 100, 100, 0.29, "A-", "Range + closing speed, modern WILL"),
  /** Rank 41 — Compare module default; not in top-40 board filter */
  n("dylan-sampson", 41, "Dylan Sampson", "RB", "Tennessee", "SEC", "5-8", 200, 4.42, 38, 120, 16, 84.0, 91, 85, 82, 63, 63, 0.62, "A-", "SEC rushing leader, home-run speed — Compare default"),
];

/** Top 40 for board / ticker primary list */
export const PROSPECTS_TOP_40 = PROSPECTS.filter((p) => p.rank <= 40);

export function prospectById(id: string): Prospect | undefined {
  return PROSPECTS.find((p) => p.id === id);
}

export function prospectByName(name: string): Prospect | undefined {
  return PROSPECTS.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
}
