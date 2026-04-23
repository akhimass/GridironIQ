export type TraitGrade = { trait: string; grade: number };

export type ProspectTraits = {
  criticalFactors: TraitGrade[];
  positionalFactors: TraitGrade[];
};

export const CRITICAL_FACTORS_BY_POS: Record<string, string[]> = {
  QB: ["Decision Making", "Accuracy", "Arm Talent", "Pocket Presence"],
  WR: ["Route Running", "Hands", "Separation", "YAC Ability"],
  RB: ["Vision", "Contact Balance", "Passing Game Impact"],
  TE: ["Hands", "Route Running", "Blocking Effort", "Athleticism"],
  EDGE: ["Pass Rush Repertoire", "First Step Quickness", "Motor", "Run Defense"],
  OT: ["Pass Protection", "Run Blocking", "Footwork", "Anchor"],
  CB: ["Man Coverage", "Zone Coverage", "Ballhawking", "Physicality"],
  S: ["Range", "Coverage Instincts", "Tackling", "Ball Skills"],
  LB: ["Instincts", "Coverage Range", "Pass Rush", "Tackling"],
  IDL: ["Pass Rush Get-Off", "Anchor", "Motor", "Run Defense"],
  IOL: ["Pass Protection", "Run Blocking", "Anchor", "Technique"],
};

export const POSITIONAL_FACTORS_BY_POS: Record<string, string[]> = {
  QB: ["Mobility", "Toughness", "Play Speed", "Leadership"],
  WR: ["Blocking", "Play Speed", "Contested Catch", "ST Value"],
  RB: [
    "Play Speed",
    "Elusiveness",
    "Power",
    "Playmaker",
    "Catching Skill",
    "Pass Pro",
    "Ball Security",
    "Toughness",
    "ST Value",
  ],
  TE: ["Speed", "Run After Catch", "Play Speed", "Size"],
  EDGE: ["Bend", "Power", "Pursuit", "ST Value"],
  OT: ["Athleticism", "Hand Usage", "Lateral Quickness", "Toughness"],
  CB: ["Press Technique", "Recovery Speed", "ST Value", "Toughness"],
  S: ["Run Support", "Communication", "Versatility", "ST Value"],
  LB: ["Play Speed", "Run Defense", "Block Shedding", "ST Value"],
  IDL: ["Leverage", "Pursuit", "Effort", "ST Value"],
  IOL: ["Movement Skills", "Strength", "Versatility", "Communication"],
};

function clampGrade(g: number): number {
  return Math.max(4, Math.min(9, Math.round(g * 10) / 10));
}

function deriveTraits(pos: string, giq: number, ath: number, prod: number, eff: number): ProspectTraits {
  const posKey = pos === "IDL" ? "IDL" : pos;
  const critNames = CRITICAL_FACTORS_BY_POS[posKey] ?? CRITICAL_FACTORS_BY_POS.LB;
  const posNames = POSITIONAL_FACTORS_BY_POS[posKey] ?? POSITIONAL_FACTORS_BY_POS.LB;
  const base = 5.2 + giq * 0.028 + ath * 0.008 + prod * 0.006 + eff * 0.004;

  const criticalFactors = critNames.map((trait, i) => ({
    trait,
    grade: clampGrade(base + (i % 3) * 0.35 - (i % 2) * 0.2),
  }));

  const positionalFactors = posNames.map((trait, i) => ({
    trait,
    grade: clampGrade(base - 0.15 + (i % 4) * 0.25 + (i % 3) * 0.1),
  }));

  return { criticalFactors, positionalFactors };
}

/** Explicit SIS-style trait cards (1–9). Source: SIS critical / positional factor framework. */
export const PROSPECT_TRAITS: Record<string, ProspectTraits> = {
  "fernando-mendoza": {
    criticalFactors: [
      { trait: "Decision Making", grade: 8 },
      { trait: "Accuracy", grade: 8 },
      { trait: "Arm Talent", grade: 7 },
      { trait: "Pocket Presence", grade: 7 },
    ],
    positionalFactors: [
      { trait: "Mobility", grade: 6 },
      { trait: "Toughness", grade: 7 },
      { trait: "Play Speed", grade: 7 },
      { trait: "Leadership", grade: 8 },
    ],
  },
  "jeremiyah-love": {
    criticalFactors: [
      { trait: "Vision", grade: 6 },
      { trait: "Contact Balance", grade: 7 },
      { trait: "Passing Game Impact", grade: 7 },
    ],
    positionalFactors: [
      { trait: "Play Speed", grade: 7 },
      { trait: "Elusiveness", grade: 6 },
      { trait: "Power", grade: 5 },
      { trait: "Playmaker", grade: 7 },
      { trait: "Catching Skill", grade: 7 },
      { trait: "Pass Pro", grade: 7 },
      { trait: "Ball Security", grade: 7 },
      { trait: "Toughness", grade: 6 },
      { trait: "ST Value", grade: 6 },
    ],
  },
  "kenyon-sadiq": {
    criticalFactors: [
      { trait: "Hands", grade: 6 },
      { trait: "Route Running", grade: 6 },
      { trait: "Blocking Effort", grade: 5 },
      { trait: "Athleticism", grade: 9 },
    ],
    positionalFactors: [
      { trait: "Speed", grade: 9 },
      { trait: "Run After Catch", grade: 7 },
      { trait: "Play Speed", grade: 8 },
      { trait: "Size", grade: 7 },
    ],
  },
  "arvell-reese": {
    criticalFactors: [
      { trait: "Pass Rush Repertoire", grade: 7 },
      { trait: "First Step Quickness", grade: 8 },
      { trait: "Motor", grade: 8 },
      { trait: "Run Defense", grade: 7 },
    ],
    positionalFactors: [
      { trait: "Bend", grade: 7 },
      { trait: "Power", grade: 7 },
      { trait: "Pursuit", grade: 8 },
      { trait: "ST Value", grade: 6 },
    ],
  },
  "makai-lemon": {
    criticalFactors: [
      { trait: "Route Running", grade: 8 },
      { trait: "Hands", grade: 7 },
      { trait: "Separation", grade: 8 },
      { trait: "YAC Ability", grade: 7 },
    ],
    positionalFactors: [
      { trait: "Blocking", grade: 5 },
      { trait: "Play Speed", grade: 8 },
      { trait: "Contested Catch", grade: 6 },
      { trait: "ST Value", grade: 6 },
    ],
  },
};

export function getProspectTraits(
  id: string,
  pos: string,
  giq: number,
  ath: number,
  prod: number,
  eff: number
): ProspectTraits {
  const hit = PROSPECT_TRAITS[id];
  if (hit) return hit;
  return deriveTraits(pos, giq, ath, prod, eff);
}
