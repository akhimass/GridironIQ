from __future__ import annotations

import json
import pathlib
from dataclasses import dataclass, field
from typing import Any, Optional

import numpy as np
import pandas as pd

from .team_needs import NEED_BUCKETS


def _repo_root() -> pathlib.Path:
    # .../src/gridironiq/draft/offseason_context.py -> parents[3] == repo root
    return pathlib.Path(__file__).resolve().parents[3]


def default_transactions_path() -> pathlib.Path:
    return _repo_root() / "data" / "offseason" / "transactions_2026.json"


def default_division_context_path() -> pathlib.Path:
    return _repo_root() / "data" / "offseason" / "division_context.json"


@dataclass
class OffseasonMove:
    """One offseason row from transactions_2026.json (types vary)."""

    type: str
    player: str
    pos: str
    from_team: Optional[str]
    to_team: Optional[str]
    contract_aav: float = 0.0
    contract_years: int = 0
    impact_note: str = ""
    date: str = ""
    draft_need_impact: Optional[dict[str, dict[str, float]]] = None


@dataclass
class TeamOffseasonContext:
    team: str
    season: int
    moves: list[OffseasonMove] = field(default_factory=list)
    positions_filled: dict[str, float] = field(default_factory=dict)
    positions_lost: dict[str, float] = field(default_factory=dict)
    adjusted_need_scores: dict[str, float] = field(default_factory=dict)
    division_intel: dict[str, Any] = field(default_factory=dict)
    pick_changes: list[dict[str, Any]] = field(default_factory=list)


def _load_json_sidecar_moves(path: pathlib.Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    if path.suffix == ".jsonl":
        rows: list[dict[str, Any]] = []
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
        return rows
    obj = json.loads(raw)
    if isinstance(obj, list):
        return list(obj)
    if isinstance(obj, dict) and isinstance(obj.get("transactions"), list):
        return list(obj["transactions"])
    return []


def load_transactions_json(
    transactions_path: str | pathlib.Path | None = None,
) -> dict[str, Any]:
    path = pathlib.Path(transactions_path) if transactions_path else default_transactions_path()
    if not path.exists():
        return {"season": 2026, "transactions": [], "pick_changes": []}
    data = json.loads(path.read_text(encoding="utf-8"))
    txs = list(data.get("transactions") or [])
    root = path.parent
    for name in ("transactions_2026.moves.json", "transactions_2026.moves.jsonl"):
        txs.extend(_load_json_sidecar_moves(root / name))
    full = root / "transactions_2026.full.json"
    if full.exists() and not txs:
        merged = json.loads(full.read_text(encoding="utf-8"))
        if isinstance(merged, dict) and merged.get("transactions"):
            txs = list(merged["transactions"])
    dl = pathlib.Path.home() / "Downloads" / "transactions_2026.json"
    if dl.exists() and not txs:
        merged = json.loads(dl.read_text(encoding="utf-8"))
        if isinstance(merged, dict) and merged.get("transactions"):
            txs = list(merged["transactions"])
    data["transactions"] = txs
    return data


def load_transaction_sources(transactions_path: str | pathlib.Path | None = None) -> list[str]:
    data = load_transactions_json(transactions_path)
    src = data.get("sources")
    return list(src) if isinstance(src, list) else []


def load_transactions_override(
    transactions_path: str | pathlib.Path | None = None,
) -> list[OffseasonMove]:
    """
    Load the manually-maintained transactions JSON.
    This is the primary source for 2026 offseason moves.
    """
    data = load_transactions_json(transactions_path)
    moves: list[OffseasonMove] = []
    for t in data.get("transactions", []):
        c = t.get("contract") or {}
        pb = t.get("pos_bucket") or t.get("pos")
        pos_s = "" if pb is None else str(pb)
        di = t.get("draft_need_impact")
        parsed_di: Optional[dict[str, dict[str, float]]] = None
        if isinstance(di, dict) and di:
            parsed_di = {}
            for tm, inner in di.items():
                if not isinstance(inner, dict):
                    continue
                parsed_di[str(tm).upper()] = {str(k).upper(): float(v) for k, v in inner.items()}
        moves.append(
            OffseasonMove(
                type=str(t.get("type", "unknown")),
                player=str(t.get("player", "")),
                pos=pos_s or "UNK",
                from_team=t.get("from_team"),
                to_team=t.get("to_team"),
                contract_aav=float(c.get("aav", 0) or 0),
                contract_years=int(c.get("years", 0) or 0),
                impact_note=str(t.get("impact_note", "")),
                date=str(t.get("date", "")),
                draft_need_impact=parsed_di,
            )
        )
    return moves


def load_pick_changes(transactions_path: str | pathlib.Path | None = None) -> list[dict[str, Any]]:
    data = load_transactions_json(transactions_path)
    return list(data.get("pick_changes") or [])


def load_nflverse_trades(season: int) -> list[OffseasonMove]:
    """
    Supplement transactions with nflverse load_trades() data.
    Converts trade records to OffseasonMove format (best-effort; schema varies).
    """
    try:
        import nflreadpy as nfl

        trades_df = nfl.load_trades().to_pandas()
        if "season" in trades_df.columns:
            trades_df = trades_df[trades_df["season"] == season]

        moves: list[OffseasonMove] = []
        for _, row in trades_df.iterrows():
            if pd.notna(row.get("receives_players", "")):
                players = str(row.get("receives_players", "")).split(";")
                for p in players:
                    if p.strip():
                        moves.append(
                            OffseasonMove(
                                type="trade",
                                player=p.strip(),
                                pos="UNK",
                                from_team=row.get("team_2"),
                                to_team=row.get("team_1"),
                                date=str(row.get("trade_date", "")),
                                draft_need_impact=None,
                            )
                        )
        return moves
    except Exception as e:  # noqa: BLE001
        print(f"[offseason_context] nflverse trades load failed: {e}")
        return []


def _map_pos_to_bucket(nfl_pos: str) -> str:
    """Map nflverse position strings to GridironIQ position buckets."""
    mapping = {
        "QB": "QB",
        "RB": "RB",
        "FB": "RB",
        "WR": "WR",
        "TE": "TE",
        "T": "OT",
        "G": "IOL",
        "C": "IOL",
        "DE": "EDGE",
        "OLB": "EDGE",
        "DT": "IDL",
        "NT": "IDL",
        "MLB": "LB",
        "ILB": "LB",
        "LB": "LB",
        "CB": "CB",
        "SS": "SAF",
        "FS": "SAF",
        "DB": "SAF",
        "K": "ST",
        "P": "ST",
        "LS": "ST",
    }
    return mapping.get(str(nfl_pos).strip(), "UNK")


def infer_free_agency_from_rosters(team: str, season: int) -> tuple[list[OffseasonMove], list[OffseasonMove]]:
    """
    Diff weekly rosters to infer free agency signings and losses.
    Compares final roster of season N-1 to first roster of season N.
    """
    try:
        import nflreadpy as nfl

        prev_rosters = nfl.load_rosters_weekly(seasons=[season - 1]).to_pandas()
        curr_rosters = nfl.load_rosters_weekly(seasons=[season]).to_pandas()

        prev_team = prev_rosters[
            (prev_rosters["team"] == team) & (prev_rosters["week"] == prev_rosters["week"].max())
        ][["player_name", "position", "gsis_id"]].copy()

        curr_team = curr_rosters[
            (curr_rosters["team"] == team) & (curr_rosters["week"] == curr_rosters["week"].min())
        ][["player_name", "position", "gsis_id"]].copy()

        prev_ids = set(prev_team["gsis_id"].dropna())
        curr_ids = set(curr_team["gsis_id"].dropna())

        new_player_ids = curr_ids - prev_ids
        lost_player_ids = prev_ids - curr_ids

        signings: list[OffseasonMove] = []
        for _, row in curr_team[curr_team["gsis_id"].isin(new_player_ids)].iterrows():
            signings.append(
                OffseasonMove(
                    type="free_agency_signing",
                    player=str(row["player_name"]),
                    pos=_map_pos_to_bucket(str(row["position"])),
                    from_team=None,
                    to_team=team,
                    draft_need_impact=None,
                )
            )

        losses: list[OffseasonMove] = []
        for _, row in prev_team[prev_team["gsis_id"].isin(lost_player_ids)].iterrows():
            losses.append(
                OffseasonMove(
                    type="free_agency_loss",
                    player=str(row["player_name"]),
                    pos=_map_pos_to_bucket(str(row["position"])),
                    from_team=team,
                    to_team=None,
                    draft_need_impact=None,
                )
            )

        return signings, losses
    except Exception as e:  # noqa: BLE001
        print(f"[offseason_context] roster diff failed: {e}")
        return [], []


def normalize_draft_impact_bucket(key: str) -> Optional[str]:
    """Map JSON position keys (pos / pos_bucket / draft_need_impact keys) to NEED_BUCKETS."""
    k = str(key).strip().upper()
    if not k or k.startswith("_"):
        return None
    alias = {
        "S": "SAF",
        "SS": "SAF",
        "FS": "SAF",
        "DB": "SAF",
        "DT": "IDL",
        "NT": "IDL",
        "DE": "EDGE",
        "T": "OT",
        "G": "IOL",
        "C": "IOL",
        "ST": "ST",
        "LS": "ST",
    }
    k = alias.get(k, k)
    if k in ("ST", "UNK"):
        return None
    return k if k in NEED_BUCKETS else None


def _sum_row_impacts(transactions: list[dict[str, Any]], team_u: str) -> dict[str, float]:
    delta = {b: 0.0 for b in NEED_BUCKETS}
    for t in transactions:
        di = t.get("draft_need_impact")
        if not isinstance(di, dict) or not di:
            continue
        inner = di.get(team_u)
        if not isinstance(inner, dict):
            continue
        for pk, dv in inner.items():
            nb = normalize_draft_impact_bucket(str(pk))
            if nb:
                delta[nb] += float(dv)
    return delta


def _net_row(net_root: Any, team_u: str) -> dict[str, float]:
    out = {b: 0.0 for b in NEED_BUCKETS}
    if not isinstance(net_root, dict):
        return out
    row = net_root.get(team_u)
    if not isinstance(row, dict):
        return out
    for pk, dv in row.items():
        if str(pk).startswith("_"):
            continue
        nb = normalize_draft_impact_bucket(str(pk))
        if nb:
            out[nb] += float(dv)
    return out


def _legacy_cycle(
    adjusted: dict[str, float],
    team_u: str,
    transactions_path: str | pathlib.Path | None,
) -> dict[str, float]:
    """AAV-based heuristic when no analyst deltas are present."""
    all_moves = load_transactions_override(transactions_path)
    team_moves = [m for m in all_moves if m.to_team == team_u or m.from_team == team_u]
    for move in team_moves:
        pos = move.pos
        if pos not in adjusted or pos == "UNK":
            continue
        mtype = str(move.type).lower()
        if mtype in ("trade_cancelled", "waived"):
            continue
        if move.draft_need_impact:
            continue
        if move.to_team == team_u:
            reduction = _compute_need_reduction(move, pos)
            adjusted[pos] = max(0.0, adjusted[pos] - reduction)
        elif move.from_team == team_u:
            increase = _compute_need_increase(move, pos)
            adjusted[pos] = min(100.0, adjusted[pos] + increase)
    return adjusted


def compute_adjusted_need_scores(
    team: str,
    season: int,
    base_need_scores: dict[str, float],
    transactions_path: str | pathlib.Path | None = None,
) -> dict[str, float]:
    """
    Adjust base need scores using offseason overrides.

    Priority:
      1) Sum per-transaction ``draft_need_impact`` slices for the team (when rows exist).
      2) Else apply ``net_need_adjustments_by_team`` row for the team (curated cumulative deltas).
      3) Else legacy AAV / to-from inference on rows without explicit impacts.
    """
    del season
    path = pathlib.Path(transactions_path) if transactions_path else default_transactions_path()
    data = load_transactions_json(path)
    transactions = list(data.get("transactions") or [])
    team_u = str(team).upper()
    adjusted = {b: float(base_need_scores.get(b, 0.0)) for b in NEED_BUCKETS}

    row_sum = _sum_row_impacts(transactions, team_u)
    if sum(abs(v) for v in row_sum.values()) > 1e-6:
        for b in NEED_BUCKETS:
            adjusted[b] += row_sum[b]
    else:
        net_d = _net_row(data.get("net_need_adjustments_by_team"), team_u)
        if sum(abs(v) for v in net_d.values()) > 1e-6:
            for b in NEED_BUCKETS:
                adjusted[b] += net_d[b]
        else:
            adjusted = _legacy_cycle(adjusted, team_u, path)

    for b in NEED_BUCKETS:
        adjusted[b] = float(np.clip(adjusted[b], 0.0, 100.0))
    return adjusted


def _compute_need_reduction(move: OffseasonMove, pos: str) -> float:
    """How much to reduce need score when team acquires a player."""
    aav = float(move.contract_aav)
    years = int(move.contract_years)

    market_starter = {
        "QB": 40_000_000,
        "EDGE": 22_000_000,
        "OT": 18_000_000,
        "WR": 18_000_000,
        "TE": 12_000_000,
        "CB": 15_000_000,
        "SAF": 10_000_000,
        "LB": 12_000_000,
        "IDL": 15_000_000,
        "IOL": 14_000_000,
        "RB": 8_000_000,
    }

    if aav == 0.0:
        aav = float(market_starter.get(pos, 10_000_000))

    market = float(market_starter.get(pos, 10_000_000))
    quality_ratio = min(aav / market, 2.0)

    commitment_mult = 1.0 if years <= 1 else (1.2 if years == 2 else 1.4)
    reduction = quality_ratio * commitment_mult * 20.0

    if years == 1:
        reduction *= 0.5

    return float(np.clip(reduction, 2.0, 40.0))


def _compute_need_increase(move: OffseasonMove, pos: str) -> float:
    """How much to increase need when team loses a player."""
    aav = float(move.contract_aav)
    if aav == 0.0:
        return 10.0

    market_starter = {
        "QB": 40_000_000,
        "EDGE": 22_000_000,
        "OT": 18_000_000,
        "WR": 18_000_000,
        "TE": 12_000_000,
        "CB": 15_000_000,
        "SAF": 10_000_000,
        "LB": 12_000_000,
        "IDL": 15_000_000,
        "IOL": 14_000_000,
        "RB": 8_000_000,
    }
    market = float(market_starter.get(pos, 10_000_000))
    quality_ratio = min(aav / market, 2.0)
    return float(np.clip(quality_ratio * 18.0, 5.0, 35.0))


def build_division_intel(
    team: str,
    season: int,
    transactions_path: str | pathlib.Path | None = None,
    division_context_path: str | pathlib.Path | None = None,
) -> dict[str, Any]:
    """
    Division rival offseason intelligence (Dan Morgan outward-looking layer).
    """
    del season
    team_u = str(team).upper()
    ctx_path = pathlib.Path(division_context_path) if division_context_path else default_division_context_path()
    if not ctx_path.exists():
        return {}

    ctx = json.loads(ctx_path.read_text())
    if str(ctx.get("team", "")).upper() != team_u:
        return {}

    division_rivals = list(ctx.get("division_rivals") or [])
    rival_data = ctx.get("division_analysis") or {}

    all_moves = load_transactions_override(transactions_path)

    rival_intel: dict[str, Any] = {}
    for rival in division_rivals:
        rival_u = str(rival).upper()
        rival_signings = [m for m in all_moves if m.to_team == rival_u]
        rival_losses = [m for m in all_moves if m.from_team == rival_u]

        positions_filled: dict[str, int] = {}
        for m in rival_signings:
            positions_filled[m.pos] = positions_filled.get(m.pos, 0) + 1

        positions_lost: dict[str, int] = {}
        for m in rival_losses:
            positions_lost[m.pos] = positions_lost.get(m.pos, 0) + 1

        rival_intel[rival_u] = {
            "signings": [{"player": m.player, "pos": m.pos, "aav": m.contract_aav} for m in rival_signings],
            "losses": [{"player": m.player, "pos": m.pos} for m in rival_losses],
            "positions_filled": positions_filled,
            "positions_lost": positions_lost,
            "remaining_needs": (rival_data.get(rival_u) or rival_data.get(rival) or {}).get("needs_created", []),
            "draft_pick": (rival_data.get(rival_u) or rival_data.get(rival) or {}).get("draft_pick"),
        }

    return {
        "rivals": rival_intel,
        "division_gaps": ctx.get("division_gaps", {}),
        "strategic_insight": _generate_division_insight(team_u, rival_intel, ctx),
    }


def _generate_division_insight(team: str, rival_intel: dict[str, Any], ctx: dict[str, Any]) -> list[str]:
    """Plain-English strategic insights from division analysis."""
    insights: list[str] = []
    gaps = ctx.get("division_gaps") or {}
    has_no = list(gaps.get("division_has_no") or [])

    if "elite_TE" in has_no:
        insights.append(
            f"No NFC South team has an elite receiving TE. Drafting a premium TE creates "
            f"an immediate structural mismatch vs all 3 division rivals for {team}."
        )

    if "elite_pass_rush" in has_no:
        insights.append(
            "Pass rush is weak division-wide. Adding an elite EDGE alongside a marquee free-agent "
            f"signing can give {team} the best pass rush in the NFC South."
        )

    for rival, data in rival_intel.items():
        rem = data.get("remaining_needs") or []
        if rem:
            dp = data.get("draft_pick", "?")
            insights.append(
                f"{rival} still needs {', '.join(rem)} — expect overlap with {team}'s board "
                f"ahead of pick {dp}."
            )

    return insights


def need_adjustment_deltas(
    base: dict[str, float], adjusted: dict[str, float]
) -> dict[str, float]:
    """Per-bucket delta: adjusted - base (negative means need decreased)."""
    return {b: round(float(adjusted.get(b, 0.0)) - float(base.get(b, 0.0)), 2) for b in NEED_BUCKETS}


def offseason_summary_payload(
    base: dict[str, float],
    adjusted: dict[str, float],
    moves_applied: int,
) -> dict[str, Any]:
    deltas = need_adjustment_deltas(base, adjusted)
    neg = sorted(((b, v) for b, v in deltas.items() if v < -0.05), key=lambda x: x[1])
    pos = sorted(((b, v) for b, v in deltas.items() if v > 0.05), key=lambda x: -x[1])
    biggest_reduction = "none"
    if neg:
        b, v = neg[0]
        biggest_reduction = f"{b} ({v:+.1f})"
    biggest_increase = "none"
    if pos:
        b, v = pos[0]
        biggest_increase = f"{b} ({v:+.1f})"
    return {
        "moves_applied": moves_applied,
        "biggest_reduction": biggest_reduction,
        "biggest_increase": biggest_increase,
    }
