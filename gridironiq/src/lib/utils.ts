import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const posColorMap: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  QB: { bg: "rgba(224,82,82,0.15)", text: "#e05252", border: "#e05252" },
  WR: { bg: "rgba(41,184,224,0.12)", text: "#29b8e0", border: "#29b8e0" },
  RB: { bg: "rgba(62,207,122,0.12)", text: "#3ecf7a", border: "#3ecf7a" },
  TE: { bg: "rgba(212,168,67,0.15)", text: "#d4a843", border: "#d4a843" },
  EDGE: { bg: "rgba(192,128,240,0.15)", text: "#c080f0", border: "#c080f0" },
  OT: { bg: "rgba(100,150,220,0.15)", text: "#6496dc", border: "#6496dc" },
  IOL: { bg: "rgba(100,150,220,0.10)", text: "#6496dc", border: "#6496dc" },
  S: { bg: "rgba(80,180,160,0.12)", text: "#50b4a0", border: "#50b4a0" },
  CB: { bg: "rgba(220,140,80,0.12)", text: "#dc8c50", border: "#dc8c50" },
  LB: { bg: "rgba(160,160,80,0.12)", text: "#a0a050", border: "#a0a050" },
  IDL: { bg: "rgba(120,120,130,0.2)", text: "#9ca3af", border: "#9ca3af" },
};

export function posMatchesNeed(pos: string, need: string): boolean {
  const p = pos.toUpperCase();
  const n = need.toUpperCase();
  if (p === n) return true;
  if (n === "DB" && (p === "CB" || p === "S")) return true;
  if (n === "EDGE" && p === "EDGE") return true;
  if (n === "LB" && (p === "LB" || p === "EDGE")) return true;
  if (n === "IDL" && p === "IDL") return true;
  if (n === "SAF" && p === "S") return true;
  return false;
}
