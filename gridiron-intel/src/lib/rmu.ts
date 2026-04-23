/**
 * Live RMU/SAC hackathon model outputs served as static JSON/CSV under /rmu/.
 *
 * Source of truth lives in `outputs/real_predictions/` and is copied into
 * `gridiron-intel/public/rmu/` by the `scripts/run_real_draft_engine.py` pipeline
 * (see also the companion presentation builder). This module exposes a single
 * React Query hook that fans out to all artifacts so the Draft Room can overlay
 * P(R1) probabilities, confidence chips, headshots, and feature-importance
 * tables on top of the existing nflverse big board.
 */
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";

export type RmuPosition = "QB" | "WR" | "RB";
export type RmuConfidence = "LOCK" | "HIGH" | "MEDIUM" | "LOW";

export interface RmuProspect {
  position: RmuPosition;
  name: string;
  college_team: string;
  college_conference: string | null;
  r1_probability: number;
  r1_predicted: 0 | 1;
  confidence: RmuConfidence;
  cfbd_id: string | null;
  headshot_url: string | null;
  headshot_path: string | null;
}

export interface RmuMetricsSummary {
  QB: { lr_auc: number; xgb_auc: number };
  WR: { lr_auc: number; xgb_auc: number };
  RB: { lr_auc: number; xgb_auc: number };
}

export interface RmuFeatureRow {
  feature: string;
  lr_coef: number;
  lr_abs: number;
  xgb_gain: number;
  rank_lr: number;
  rank_xgb: number;
  avg_rank: number;
}

export interface RmuData {
  /** All prospects scored by the first-round model across QB / WR / RB. */
  manifest: RmuProspect[];
  /** Held-out AUC for Logistic Regression + XGBoost per position. */
  metrics: RmuMetricsSummary;
  /** Feature importance tables (top drivers) per position. */
  featureImportance: Record<RmuPosition, RmuFeatureRow[]>;
  /** Lookup table keyed by `normalizeName(player_name)`. */
  byName: Map<string, RmuProspect>;
  /** Ensemble holdout AUC, averaged across the three positions (40% LR + 60% XGB). */
  ensembleAucMean: number;
  /** Count of prospects the model projects inside Round 1 (r1_predicted === 1). */
  r1Projected: number;
  /** Highest P(R1) seen across the manifest, expressed on a 0–100 scale. */
  topScore: number;
}

/** Lowercase + strip punctuation + collapse whitespace. */
export function normalizeName(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/[.'`’]/g, "")
    .replace(/\s+jr\.?$/i, "")
    .replace(/\s+sr\.?$/i, "")
    .replace(/\s+ii+$/i, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`rmu: ${url} -> ${res.status}`);
  return (await res.json()) as T;
}

async function fetchCsv<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`rmu: ${url} -> ${res.status}`);
  const text = await res.text();
  const parsed = Papa.parse<T>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

async function loadRmuData(): Promise<RmuData> {
  const [manifest, metrics, qbFi, wrFi, rbFi] = await Promise.all([
    fetchJson<RmuProspect[]>("/rmu/prospect_manifest.json"),
    fetchJson<RmuMetricsSummary>("/rmu/metrics_summary.json"),
    fetchCsv<RmuFeatureRow>("/rmu/qb_feature_importance.csv"),
    fetchCsv<RmuFeatureRow>("/rmu/wr_feature_importance.csv"),
    fetchCsv<RmuFeatureRow>("/rmu/rb_feature_importance.csv"),
  ]);

  const byName = new Map<string, RmuProspect>();
  for (const row of manifest) {
    byName.set(normalizeName(row.name), row);
  }

  const posList: RmuPosition[] = ["QB", "WR", "RB"];
  const ensembleAuc =
    posList.reduce((acc, pos) => {
      const m = metrics[pos];
      return acc + (0.4 * m.lr_auc + 0.6 * m.xgb_auc);
    }, 0) / posList.length;

  const r1Projected = manifest.filter((p) => p.r1_predicted === 1).length;
  const topScore = manifest.reduce((acc, p) => Math.max(acc, p.r1_probability), 0) * 100;

  return {
    manifest,
    metrics,
    featureImportance: { QB: qbFi, WR: wrFi, RB: rbFi },
    byName,
    ensembleAucMean: ensembleAuc,
    r1Projected,
    topScore,
  };
}

/** React Query hook that resolves the full RMU overlay once per session. */
export function useRmuData() {
  return useQuery({
    queryKey: ["rmu-data"],
    queryFn: loadRmuData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Convenience lookup used by the board table + right rail. */
export function matchRmu(
  data: RmuData | undefined,
  name: string | null | undefined,
): RmuProspect | null {
  if (!data) return null;
  return data.byName.get(normalizeName(name)) ?? null;
}

/** Map a confidence bucket to the hex color used by the draft room UI. */
export function confidenceColor(c: RmuConfidence | null | undefined): string {
  switch (c) {
    case "LOCK":
      return "#d4a843";
    case "HIGH":
      return "#3ecf7a";
    case "MEDIUM":
      return "#29b8e0";
    case "LOW":
    default:
      return "#7d8fa8";
  }
}
