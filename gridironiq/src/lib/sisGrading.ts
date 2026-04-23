/** SIS-style 1–9 role grading (calibrated from GIQ composite). Source: Sports Info Solutions methodology. */

export type SISTier = "elite" | "starter" | "rotational" | "backup" | "udfa";

export type SISGrade = {
  grade: number;
  label: string;
  tier: SISTier;
  roundProj: string;
};

export function getRoleMap(pos: string): Record<string, string> {
  const maps: Record<string, Record<string, string>> = {
    QB: {
      "8.0": "High-End 3-Down Starter",
      "7.5": "High-End 3-Down Starter",
      "7.0": "Solid Starting QB",
      "6.8": "Solid Starting QB",
      "6.6": "Lower-End Starting QB",
      "6.4": "Starter Traits / Limited Opportunity",
      "6.2": "Good Quality Backup",
      "6.0": "Developmental Player",
      "5.7": "Career #2",
      "5.4": "Priority FA",
    },
    WR: {
      "8.0": "True WR1 / Franchise Receiver",
      "7.5": "High-End WR1 / Consistent Starter",
      "7.0": "Solid WR1-2 Starter",
      "6.8": "WR2 / Quality Starter",
      "6.6": "WR2-3 Rotational Starter",
      "6.4": "WR3 with WR2 Upside",
      "6.2": "Depth Receiver / Role Player",
      "6.0": "Developmental Receiver",
      "5.7": "Career Depth",
      "5.4": "Priority FA",
    },
    RB: {
      "8.0": "High-End 3-Down Feature Back",
      "7.5": "Consistent 3-Down Feature Back",
      "7.0": "Solid Starting RB",
      "6.8": "Starter with Limitations",
      "6.6": "Rotational / Early Down Back",
      "6.4": "Committee Back / Role Player",
      "6.2": "Backup with Starter Ceiling",
      "6.0": "Developmental Back",
      "5.7": "Career Backup",
      "5.4": "Priority FA",
    },
    TE: {
      "8.0": "Elite Receiving TE / Matchup Nightmare",
      "7.5": "High-End Starting TE",
      "7.0": "Solid 3-Down Starting TE",
      "6.8": "Quality Starting TE",
      "6.6": "Starting TE with Role Limitations",
      "6.4": "Move TE / Receiving Specialist",
      "6.2": "Rotational TE",
      "6.0": "Blocking TE / Developmental",
      "5.7": "Depth TE",
      "5.4": "Priority FA",
    },
    EDGE: {
      "8.0": "Elite Pass Rusher / Defensive Cornerstone",
      "7.5": "High-End Starting EDGE",
      "7.0": "Solid 3-Down Starter",
      "6.8": "Quality Starting EDGE",
      "6.6": "Starter with Pass Rush Upside",
      "6.4": "Rotational Pass Rusher",
      "6.2": "Depth Rusher / Special Teams",
      "6.0": "Developmental Rusher",
      "5.7": "Depth / Situational",
      "5.4": "Priority FA",
    },
    OT: {
      "8.0": "Franchise Left Tackle",
      "7.5": "High-End Starting OT",
      "7.0": "Solid Starting OT",
      "6.8": "Quality Starter / Both Sides",
      "6.6": "Starting OT with Limitations",
      "6.4": "Swing Tackle / Positional Flexibility",
      "6.2": "Depth Tackle / Guard Convert",
      "6.0": "Developmental Lineman",
      "5.7": "Depth / Interior Project",
      "5.4": "Priority FA",
    },
    CB: {
      "8.0": "Elite Shutdown Corner",
      "7.5": "High-End CB1",
      "7.0": "Solid CB1 Starter",
      "6.8": "CB1-2 Quality Starter",
      "6.6": "CB2 Starter",
      "6.4": "Slot / Rotational Corner",
      "6.2": "Nickel / Depth CB",
      "6.0": "Developmental Corner",
      "5.7": "Career Depth",
      "5.4": "Priority FA",
    },
    S: {
      "8.0": "Elite Range / Impact Safety",
      "7.5": "High-End Starting Safety",
      "7.0": "Solid 3-Down Safety",
      "6.8": "Quality Starter",
      "6.6": "Starting Safety with Role",
      "6.4": "Box S / Strong Safety Role",
      "6.2": "Depth Safety",
      "6.0": "Developmental Safety",
      "5.7": "Career Depth / ST",
      "5.4": "Priority FA",
    },
    LB: {
      "8.0": "Elite 3-Down Linebacker",
      "7.5": "High-End Starting LB",
      "7.0": "Solid 3-Down Starter",
      "6.8": "Quality Starting LB",
      "6.6": "Starter with Coverage Role",
      "6.4": "2-Down / Run Stopping LB",
      "6.2": "Rotational LB",
      "6.0": "Developmental LB",
      "5.7": "Special Teams / Depth",
      "5.4": "Priority FA",
    },
    IDL: {
      "8.0": "Elite Interior Disruptor",
      "7.5": "High-End Starting DT",
      "7.0": "Solid 3-Down DT",
      "6.8": "Quality Starter",
      "6.6": "Starter with Pass Rush Role",
      "6.4": "Rotational DT",
      "6.2": "Depth / Run Stuffer",
      "6.0": "Developmental DT",
      "5.7": "Depth / ST",
      "5.4": "Priority FA",
    },
    IOL: {
      "8.0": "Franchise Interior Lineman",
      "7.5": "High-End Starting Guard/Center",
      "7.0": "Solid Starting IOL",
      "6.8": "Quality Starter",
      "6.6": "Starting IOL with Limitations",
      "6.4": "Versatile Interior Backup",
      "6.2": "Depth Lineman",
      "6.0": "Developmental IOL",
      "5.7": "Career Depth",
      "5.4": "Priority FA",
    },
  };
  return maps[pos] ?? maps.LB;
}

/** Role label for a position at a specific SIS grade tier (matrix tooltips). */
export function sisRoleLabelAtGrade(pos: string, gradeTier: number): string {
  const roleMap = getRoleMap(pos);
  const k = gradeTier.toFixed(1);
  return roleMap[k] ?? "";
}

export function giqToSISGrade(giqScore: number, pos: string): SISGrade {
  const roleMap = getRoleMap(pos);
  const key = (g: number) => String(g);

  if (giqScore >= 94)
    return { grade: 8.0, tier: "elite", roundProj: "R1", label: roleMap[key(8.0)] ?? "Excellent" };
  if (giqScore >= 88)
    return { grade: 7.5, tier: "elite", roundProj: "R1", label: roleMap[key(7.5)] ?? "Very Good" };
  if (giqScore >= 83)
    return { grade: 7.0, tier: "starter", roundProj: "R1", label: roleMap[key(7.0)] ?? "Very Good" };
  if (giqScore >= 78)
    return { grade: 6.8, tier: "starter", roundProj: "R1", label: roleMap[key(6.8)] ?? "Good+" };
  if (giqScore >= 73)
    return { grade: 6.6, tier: "starter", roundProj: "R1-2", label: roleMap[key(6.6)] ?? "Good" };
  if (giqScore >= 68)
    return { grade: 6.4, tier: "starter", roundProj: "R2", label: roleMap[key(6.4)] ?? "Good" };
  if (giqScore >= 63)
    return { grade: 6.2, tier: "rotational", roundProj: "R2-3", label: roleMap[key(6.2)] ?? "Good" };
  if (giqScore >= 58)
    return { grade: 6.0, tier: "rotational", roundProj: "R3", label: roleMap[key(6.0)] ?? "Good" };
  if (giqScore >= 50)
    return { grade: 5.7, tier: "backup", roundProj: "R4-5", label: roleMap[key(5.7)] ?? "Sufficient" };
  return { grade: 5.4, tier: "udfa", roundProj: "UDFA", label: roleMap[key(5.4)] ?? "Sufficient" };
}
