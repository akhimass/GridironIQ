export type CarNeedLevel = "critical" | "high" | "medium" | "low";

export type CarNeedRow = {
  pos: string;
  score: number;
  level: CarNeedLevel;
};

export const carNeeds: CarNeedRow[] = [
  { pos: "LB", score: 100, level: "critical" },
  { pos: "IDL", score: 78, level: "high" },
  { pos: "TE", score: 77, level: "high" },
  { pos: "CB", score: 77, level: "high" },
  { pos: "IOL", score: 73, level: "medium" },
  { pos: "EDGE", score: 73, level: "medium" },
  { pos: "WR", score: 67, level: "medium" },
  { pos: "SAF", score: 65, level: "medium" },
  { pos: "OT", score: 64, level: "medium" },
  { pos: "RB", score: 63, level: "medium" },
  { pos: "QB", score: 62, level: "medium" },
];
