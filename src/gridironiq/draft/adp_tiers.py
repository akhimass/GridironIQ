"""
Historical ADP-style fallback when no consensus board files are configured.

Down-weights availability at a pick for premium positions / early ranks so
``recommend_pick`` does not return the same top prospects at pick 19 and pick 196.
"""

from __future__ import annotations

from typing import Any, Dict, List

# Overall pick-number cutoffs by position (Phase 3D — RMU / production fallback).
ADP_TIER_CUTOFFS: Dict[str, Dict[str, int]] = {
    "QB": {"r1_end": 32, "r2_end": 64},
    "EDGE": {"r1_end": 30, "r2_end": 65},
    "OT": {"r1_end": 35, "r2_end": 75},
    "WR": {"r1_end": 40, "r2_end": 80},
    "CB": {"r1_end": 45, "r2_end": 90},
    "TE": {"r1_end": 50, "r2_end": 95},
    "LB": {"r1_end": 55, "r2_end": 100},
    "SAF": {"r1_end": 55, "r2_end": 105},
    "IDL": {"r1_end": 65, "r2_end": 115},
    "IOL": {"r1_end": 70, "r2_end": 120},
    "RB": {"r1_end": 75, "r2_end": 130},
}


def adp_discount(pos: str, pick_slot: int, pos_rank: int) -> float:
    """
    Multiplier in (0, 1] applied to simulated availability when no external consensus boards exist.
    """
    tiers = ADP_TIER_CUTOFFS.get(pos, {"r1_end": 60, "r2_end": 110})
    r1 = int(tiers["r1_end"])
    pr = int(pos_rank)
    ps = int(pick_slot)

    if pr == 1 and ps > r1:
        return 0.15
    if pr <= 3 and ps > r1 * 0.8:
        return 0.55
    if pr <= 5 and ps > r1:
        return 0.40
    return 1.0


def adp_availability_discount(pos: str, pick_slot: int, model_rank_at_pos: int) -> float:
    """Alias for :func:`adp_discount` (model rank within position bucket)."""
    return adp_discount(pos, pick_slot, model_rank_at_pos)


def apply_adp_availability_fallback(
    availability: Dict[str, float],
    prospects: List[Dict[str, Any]],
    pick_number: int,
) -> Dict[str, float]:
    """Per-prospect availability *= ADP discount using model rank within ``pos_bucket``."""
    by_bucket: Dict[str, List[Dict[str, Any]]] = {}
    for p in prospects:
        b = str(p.get("pos_bucket") or "UNK")
        by_bucket.setdefault(b, []).append(p)

    rank_in_pos: Dict[str, int] = {}
    for _b, plist in by_bucket.items():
        plist.sort(key=lambda x: -float(x.get("prospect_score", 0.0)))
        for i, p in enumerate(plist, start=1):
            rank_in_pos[str(p.get("player_id", ""))] = i

    out: Dict[str, float] = {}
    for p in prospects:
        pid = str(p.get("player_id", ""))
        if not pid:
            continue
        base = float(availability.get(pid, 0.5))
        pos = str(p.get("pos_bucket") or "UNK")
        r = int(rank_in_pos.get(pid, 99))
        d = adp_discount(pos, int(pick_number), r)
        out[pid] = round(max(0.0, min(1.0, base * d)), 4)

    for pid, v in availability.items():
        if pid not in out:
            out[pid] = float(v)

    return out
