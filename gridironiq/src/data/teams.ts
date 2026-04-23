export type TeamRow = {
  abbr: string;
  name: string;
  primaryNeed: string;
  needs: [string, string];
  pickNumber: number;
  colors: { primary: string; secondary: string };
};

/** Custom 2026 Round 1 order */
export const DRAFT_ORDER: string[] = [
  "LV",
  "NYJ",
  "ARI",
  "TEN",
  "NYG",
  "CLE",
  "WSH",
  "NO",
  "KC",
  "CIN",
  "MIA",
  "DAL",
  "LAR",
  "BAL",
  "TB",
  "ATL",
  "DET",
  "MIN",
  "CAR",
  "IND",
  "PIT",
  "LAC",
  "PHI",
  "GB",
  "CHI",
  "BUF",
  "SF",
  "HOU",
  "JAX",
  "DEN",
  "NE",
  "SEA",
];

const needMap: Record<string, [string, string]> = {
  LV: ["QB", "EDGE"],
  NYJ: ["EDGE", "LB"],
  ARI: ["EDGE", "OT"],
  TEN: ["RB", "EDGE"],
  NYG: ["OT", "S"],
  CLE: ["WR", "OT"],
  WSH: ["CB", "EDGE"],
  NO: ["WR", "EDGE"],
  KC: ["TE", "WR"],
  CIN: ["OT", "CB"],
  MIA: ["WR", "CB"],
  DAL: ["CB", "LB"],
  LAR: ["WR", "OT"],
  BAL: ["TE", "WR"],
  TB: ["EDGE", "OT"],
  ATL: ["WR", "CB"],
  DET: ["OT", "WR"],
  MIN: ["S", "CB"],
  CAR: ["TE", "EDGE"],
  IND: ["OT", "CB"],
  PIT: ["OT", "QB"],
  LAC: ["EDGE", "IOL"],
  PHI: ["WR", "EDGE"],
  GB: ["WR", "LB"],
  CHI: ["EDGE", "OT"],
  BUF: ["WR", "CB"],
  SF: ["EDGE", "RB"],
  HOU: ["RB", "EDGE"],
  JAX: ["EDGE", "QB"],
  DEN: ["WR", "CB"],
  NE: ["QB", "WR"],
  SEA: ["RB", "EDGE"],
};

const names: Record<string, string> = {
  LV: "Las Vegas Raiders",
  NYJ: "New York Jets",
  ARI: "Arizona Cardinals",
  TEN: "Tennessee Titans",
  NYG: "New York Giants",
  CLE: "Cleveland Browns",
  WSH: "Washington Commanders",
  NO: "New Orleans Saints",
  KC: "Kansas City Chiefs",
  CIN: "Cincinnati Bengals",
  MIA: "Miami Dolphins",
  DAL: "Dallas Cowboys",
  LAR: "Los Angeles Rams",
  BAL: "Baltimore Ravens",
  TB: "Tampa Bay Buccaneers",
  ATL: "Atlanta Falcons",
  DET: "Detroit Lions",
  MIN: "Minnesota Vikings",
  CAR: "Carolina Panthers",
  IND: "Indianapolis Colts",
  PIT: "Pittsburgh Steelers",
  LAC: "Los Angeles Chargers",
  PHI: "Philadelphia Eagles",
  GB: "Green Bay Packers",
  CHI: "Chicago Bears",
  BUF: "Buffalo Bills",
  SF: "San Francisco 49ers",
  HOU: "Houston Texans",
  JAX: "Jacksonville Jaguars",
  DEN: "Denver Broncos",
  NE: "New England Patriots",
  SEA: "Seattle Seahawks",
};

export const teams: TeamRow[] = DRAFT_ORDER.map((abbr, i) => {
  const needs = needMap[abbr];
  return {
    abbr,
    name: names[abbr] ?? abbr,
    primaryNeed: needs[0],
    needs: needs,
    pickNumber: i + 1,
    colors: { primary: "#d4a843", secondary: "#0a0d14" },
  };
});

export function teamByAbbr(abbr: string): TeamRow | undefined {
  return teams.find((t) => t.abbr === abbr);
}
