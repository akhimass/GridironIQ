"""
GridironIQ — end-to-end 2026 NFL Draft first-round engine (QB / WR / RB).

Pipeline
--------
1. **Ingest** the labeled RMU training CSVs (``TrainingData/``) and the 42-row
   2026 prospect test set (``TestingData/``). The assignment data uses real
   player names and real college teams.
2. **Normalize** the CSV schema to match the pipeline contract in
   ``data/rmu_sac`` — rename ``passing_td``/``passing_int``/``round`` to
   ``passing_tds``/``passing_ints``/``draft_round``, coerce combine "NA"
   strings to NaN, and materialize sanitized copies under
   ``data/rmu_sac_real/``. Keeps the training logic identical to the hackathon
   starter code while swapping in the real prospect pool.
3. **Train + score** the dual-model ensemble (Logistic Regression + XGBoost)
   per position via ``gridironiq.models.rmu_predictions.run_rmu_pipeline``.
   Writes ``{qb,wr,rb}_predictions.csv``, feature-importance CSVs, and
   diagnostic plots (ROC, confusion, feature importance, R1 probability) to
   ``outputs/real_predictions/``.
4. **Enrich** — resolve each test prospect through CFBD's ``/roster`` endpoint
   for the 2025 season (fallback 2024), score-match by last name + first
   initial, then capture the CFBD player id (same numeric id used by ESPN)
   and construct the ESPN headshot CDN URL. Downloads every headshot to
   ``outputs/real_predictions/headshots/<slug>.png`` and writes a full
   ``prospect_manifest.json`` with probability, confidence, CFBD id, and
   headshot path per prospect.

Entry point
-----------
    python scripts/run_real_draft_engine.py

Environment
-----------
Requires ``CFBD_API_KEY`` (loaded from ``.env`` if absent in the shell).
Downloads roughly 42 PNGs from ``https://a.espncdn.com/i/headshots/...``.

Author
------
Akhi Chappidi · UNC Charlotte (RMU SAC 2026 submission).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "src"))

TRAIN_DIR = REPO_ROOT / "TrainingData"
TEST_DIR = REPO_ROOT / "TestingData"
REAL_DATA_DIR = REPO_ROOT / "data" / "rmu_sac_real"
OUT_DIR = REPO_ROOT / "outputs" / "real_predictions"
HEADSHOT_DIR = OUT_DIR / "headshots"
MANIFEST_PATH = OUT_DIR / "prospect_manifest.json"
# Frontend static mount — DraftPlatformView reads these at /rmu/* in the browser.
FRONTEND_PUBLIC_DIR = REPO_ROOT / "gridiron-intel" / "public" / "rmu"
# Artifacts copied into the frontend bundle on each run. Keep this list in sync
# with the fetches in `gridiron-intel/src/lib/rmu.ts`.
FRONTEND_ASSETS = (
    "prospect_manifest.json",
    "metrics_summary.json",
    "qb_predictions.csv",
    "wr_predictions.csv",
    "rb_predictions.csv",
    "qb_feature_importance.csv",
    "wr_feature_importance.csv",
    "rb_feature_importance.csv",
)

POSITIONS = ["QB", "WR", "RB"]

# Real training CSV → pipeline schema rename map (covers per-position columns).
RENAME = {
    "passing_td": "passing_tds",
    "passing_int": "passing_ints",
    "round": "draft_round",
}


def _normalize_df(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns to the pipeline schema, coerce "NA" combine strings."""
    df = df.copy()
    df = df.drop(columns=[c for c in df.columns if c.startswith("Unnamed")], errors="ignore")
    df = df.rename(columns={k: v for k, v in RENAME.items() if k in df.columns})
    for col in ("forty", "bench", "vertical", "broad_jump", "cone", "shuttle"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def _materialize_real_csvs() -> None:
    REAL_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for pos in POSITIONS:
        train_in = TRAIN_DIR / f"{pos}_train.csv"
        test_in = TEST_DIR / f"{pos}_Test.csv"
        train = _normalize_df(pd.read_csv(train_in))
        test = _normalize_df(pd.read_csv(test_in))
        train.to_csv(REAL_DATA_DIR / f"{pos.lower()}_train.csv", index=False)
        test.to_csv(REAL_DATA_DIR / f"{pos.lower()}_test.csv", index=False)
        print(f"[ok] materialized {pos}: train={len(train)} test={len(test)}")


def _run_pipeline() -> None:
    from gridironiq.models.rmu_predictions import run_rmu_pipeline  # noqa: PLC0415

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = run_rmu_pipeline(
        data_dir=str(REAL_DATA_DIR),
        output_dir=str(OUT_DIR),
        make_plots=True,
    )
    summary = {p: {"lr_auc": v["lr_auc"], "xgb_auc": v["xgb_auc"]} for p, v in results.items()}
    (OUT_DIR / "metrics_summary.json").write_text(json.dumps(summary, indent=2))
    print("[ok] pipeline complete; metrics:", summary)


# --------------------------------------------------------------------------- #
# CFBD roster lookup → ESPN headshot CDN
# --------------------------------------------------------------------------- #

CFBD_BASE = "https://api.collegefootballdata.com"
ESPN_HEADSHOT_TPL = "https://a.espncdn.com/i/headshots/college-football/players/full/{id}.png"


def _cfbd_get(path: str, params: Dict[str, str], api_key: str) -> list:
    q = "&".join(f"{k}={urllib.request.quote(str(v))}" for k, v in params.items() if v is not None)
    url = f"{CFBD_BASE}{path}?{q}" if q else f"{CFBD_BASE}{path}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "User-Agent": "GridironIQ/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"[warn] CFBD {path} {params} -> {e.code}")
        return []
    return data if isinstance(data, list) else []


def _load_env_dotfile() -> None:
    """Load CFBD_API_KEY from repo .env if not already in environment."""
    if os.getenv("CFBD_API_KEY"):
        return
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def _resolve_headshot(name: str, team: str, api_key: str, roster_cache: Dict[str, list]) -> Optional[dict]:
    if team not in roster_cache:
        roster_cache[team] = _cfbd_get("/roster", {"team": team, "year": 2025}, api_key)
        if not roster_cache[team]:
            roster_cache[team] = _cfbd_get("/roster", {"team": team, "year": 2024}, api_key)
    roster = roster_cache[team]
    if not roster:
        return None

    target_first, _, target_last = name.partition(" ")
    nl = name.lower().replace(".", "").replace("'", "")

    def match_score(row: dict) -> int:
        first = str(row.get("firstName") or "").lower().replace(".", "").replace("'", "")
        last = str(row.get("lastName") or "").lower().replace(".", "").replace("'", "")
        full = f"{first} {last}".strip()
        if full == nl:
            return 3
        if last == target_last.lower().replace(".", "").replace("'", "") and first.startswith(
            target_first.lower()[0]
        ):
            return 2
        if last == target_last.lower().replace(".", "").replace("'", ""):
            return 1
        return 0

    best = max(roster, key=match_score, default=None)
    if best is None or match_score(best) == 0:
        return None
    pid = str(best.get("id") or "").strip()
    if not pid:
        return None
    return {
        "cfbd_id": pid,
        "cfbd_first": best.get("firstName"),
        "cfbd_last": best.get("lastName"),
        "position": best.get("position"),
        "height": best.get("height"),
        "weight": best.get("weight"),
        "jersey": best.get("jersey"),
        "headshot_url": ESPN_HEADSHOT_TPL.format(id=pid),
    }


def _download(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "GridironIQ/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            if r.status != 200:
                return False
            dest.write_bytes(r.read())
        return True
    except Exception as e:
        print(f"[warn] headshot download {url}: {e}")
        return False


def _build_headshot_manifest() -> None:
    _load_env_dotfile()
    api_key = os.getenv("CFBD_API_KEY")
    if not api_key:
        print("[warn] no CFBD_API_KEY; skipping headshot resolution")
        return
    HEADSHOT_DIR.mkdir(parents=True, exist_ok=True)
    roster_cache: Dict[str, list] = {}
    manifest: List[dict] = []

    for pos in POSITIONS:
        test = pd.read_csv(REAL_DATA_DIR / f"{pos.lower()}_test.csv")
        preds = pd.read_csv(OUT_DIR / f"{pos.lower()}_predictions.csv")
        for _, row in preds.iterrows():
            name = row["name"]
            team = str(row["college_team"])
            meta = _resolve_headshot(name, team, api_key, roster_cache)
            safe = name.lower().replace(" ", "_").replace(".", "").replace("'", "")
            dest = HEADSHOT_DIR / f"{safe}.png"
            headshot_ok = False
            if meta:
                headshot_ok = _download(meta["headshot_url"], dest)
            record = {
                "position": pos,
                "name": name,
                "college_team": team,
                "college_conference": test.loc[test["name"] == name, "college_conference"].iloc[0],
                "r1_probability": float(row["r1_probability"]),
                "r1_predicted": int(row["r1_predicted"]),
                "confidence": row["confidence"],
                "cfbd_id": meta["cfbd_id"] if meta else None,
                "headshot_url": meta["headshot_url"] if meta else None,
                "headshot_path": str(dest.relative_to(REPO_ROOT)) if headshot_ok else None,
            }
            manifest.append(record)
            status = "ok" if headshot_ok else ("no-match" if not meta else "dl-failed")
            print(f"  [{status}] {pos} {name} ({team})")

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(f"[ok] wrote manifest {MANIFEST_PATH} ({len(manifest)} rows)")


def _sync_frontend_assets() -> None:
    """Copy the latest model outputs into the GridironIQ frontend public folder.

    Two destinations are kept in sync so the React app can fetch them statically:

    1. ``gridiron-intel/public/rmu/`` — RMU/SAC first-round model artifacts that
       the draft room overlays on the big board (see ``src/lib/rmu.ts``).
    2. ``gridiron-intel/public/engine/`` — the broader GridironIQ game-prediction
       engine: win-prob / margin / total models, per-season schedule predictions,
       defensive strength rankings, the cross-position R1 board, and a sample
       prediction (see ``src/lib/engine.ts``).

    Both directories are recreated on every run so stale outputs cannot leak.
    """
    if not FRONTEND_PUBLIC_DIR.parent.exists():
        print(f"[skip] frontend not present at {FRONTEND_PUBLIC_DIR.parent}")
        return

    FRONTEND_PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    for name in FRONTEND_ASSETS:
        src = OUT_DIR / name
        if not src.exists():
            print(f"  [warn] missing {src.relative_to(REPO_ROOT)}")
            continue
        (FRONTEND_PUBLIC_DIR / name).write_bytes(src.read_bytes())
        copied += 1
    print(f"[ok] rmu  -> {FRONTEND_PUBLIC_DIR.relative_to(REPO_ROOT)} ({copied}/{len(FRONTEND_ASSETS)})")

    engine_dir = REPO_ROOT / "gridiron-intel" / "public" / "engine"
    engine_dir.mkdir(parents=True, exist_ok=True)
    engine_assets: list[tuple[Path, Path]] = [
        (REPO_ROOT / "outputs" / "model_artifacts" / "win_prob_model.json", engine_dir / "win_prob_model.json"),
        (REPO_ROOT / "outputs" / "model_artifacts" / "margin_model.json", engine_dir / "margin_model.json"),
        (REPO_ROOT / "outputs" / "model_artifacts" / "total_model.json", engine_dir / "total_model.json"),
        (REPO_ROOT / "outputs" / "score_model.json", engine_dir / "score_model.json"),
        (REPO_ROOT / "outputs" / "prediction.json", engine_dir / "sample_prediction.json"),
        (REPO_ROOT / "outputs" / "def_strength_2025.csv", engine_dir / "def_strength_2025.csv"),
        (OUT_DIR / "r1_board_combined.csv", engine_dir / "r1_board_combined.csv"),
    ]
    for season in (2020, 2021, 2022, 2023, 2024, 2025):
        engine_assets.append(
            (
                REPO_ROOT / "outputs" / "schedule_predictions" / f"{season}_all.json",
                engine_dir / f"schedule_{season}.json",
            )
        )

    eng_copied = 0
    for src, dst in engine_assets:
        if not src.exists():
            print(f"  [warn] missing {src.relative_to(REPO_ROOT)}")
            continue
        dst.write_bytes(src.read_bytes())
        eng_copied += 1
    print(f"[ok] engine -> {engine_dir.relative_to(REPO_ROOT)} ({eng_copied}/{len(engine_assets)})")

    # ------------------------------------------------------------------
    # Real 2026 NFL draft order (ESPN) — static JSON with trades + needs.
    # ``scripts/build_2026_draft_order.py`` is the source of truth; we just
    # copy both the canonical ``outputs/`` copy and the public one if this
    # function is called before the builder ran.
    # ------------------------------------------------------------------
    data_dir = REPO_ROOT / "gridiron-intel" / "public" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    draft_src = REPO_ROOT / "outputs" / "nfl_draft_order_2026.json"
    draft_dst = data_dir / "nfl_draft_order_2026.json"
    if draft_src.exists():
        draft_dst.write_bytes(draft_src.read_bytes())
        print(f"[ok] draft -> {draft_dst.relative_to(REPO_ROOT)}")
    else:
        print(
            f"  [warn] {draft_src.relative_to(REPO_ROOT)} missing —"
            " run scripts/build_2026_draft_order.py first"
        )


def main() -> None:
    print("==> normalizing real CSVs")
    _materialize_real_csvs()
    print("\n==> running pipeline on real data")
    _run_pipeline()
    print("\n==> resolving CFBD headshots")
    _build_headshot_manifest()
    print("\n==> syncing outputs into gridiron-intel/public/rmu")
    _sync_frontend_assets()
    print("\ndone.")


if __name__ == "__main__":
    main()
