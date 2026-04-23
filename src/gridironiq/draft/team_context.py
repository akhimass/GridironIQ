from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List

from .offseason_context import (
    OffseasonMove,
    build_division_intel,
    compute_adjusted_need_scores,
    load_pick_changes,
    load_transaction_sources,
    load_transactions_json,
    load_transactions_override,
    need_adjustment_deltas,
    offseason_summary_payload,
)
from .room_production import build_room_need_score, compute_position_share_trend
from .scheme_fit import build_team_scheme_profile
from .team_needs import NEED_BUCKETS, compute_team_needs


@dataclass
class TeamContext:
    """Runtime, data-derived view of one NFL team for draft scoring (no manual priors)."""

    team: str
    season: int
    needs: Dict[str, float]
    needs_detail: Dict[str, Any]
    scheme_profile: Dict[str, Any]
    room_scores: Dict[str, float]
    snap_depth: Dict[str, float]
    injury_pressure: Dict[str, float]
    te_target_share_trend: float
    wr_target_share_trend: float
    edge_pressure_trend: float
    rb_target_share_trend: float
    pass_rate: float
    shotgun_rate: float
    need_signal_policy: Dict[str, Any]
    draft_pick_positions: List[int] = field(default_factory=list)
    base_need_scores: Dict[str, float] = field(default_factory=dict)
    need_adjustments: Dict[str, float] = field(default_factory=dict)
    division_intel: Dict[str, Any] = field(default_factory=dict)
    offseason_moves: List[OffseasonMove] = field(default_factory=list)
    pick_changes: List[Dict[str, Any]] = field(default_factory=list)

    def __repr__(self) -> str:
        ranked = sorted(self.needs.items(), key=lambda x: -x[1])[:11]
        need_s = " | ".join(f"{k}={v:.1f}" for k, v in ranked)
        raw = self.scheme_profile.get("raw", {})
        te_s = float(raw.get("te_target_share", 0.0))
        trend_note = f"te_trend={self.te_target_share_trend:+.3f}"
        src = self.need_signal_policy.get("sources", [])
        return (
            f"TeamContext({self.team} {self.season})\n"
            f"  Need Ranks: {need_s}\n"
            f"  Scheme: pass_rate={self.pass_rate:.2f} | te_share={te_s:.2f} | {trend_note}\n"
            f"  Policy: data_only | manual_need_priors={self.need_signal_policy.get('manual_need_priors')} | "
            f"sources={src}\n"
            f"  Picks: {self.draft_pick_positions}"
        )


def build_team_context(
    team: str,
    season: int,
    *,
    draft_pick_positions: List[int] | None = None,
) -> TeamContext:
    """
    Single load path for team-scoped nflverse-backed signals used by the draft pipeline.
    """
    team_u = str(team).upper()
    needs_payload = compute_team_needs(team_u, int(season))
    layers = needs_payload.get("signal_layers") or {}
    scheme = build_team_scheme_profile(team_u, int(season))

    room_scores = {b: float(build_room_need_score(team_u, b, int(season))) for b in NEED_BUCKETS}
    mx_r = max(room_scores.values()) if room_scores else 1.0
    if mx_r <= 0:
        mx_r = 1.0
    room_scores = {b: 100.0 * room_scores[b] / mx_r for b in NEED_BUCKETS}

    s2, s1, s0 = int(season) - 2, int(season) - 1, int(season)
    trend_seasons = [s2, s1, s0]
    te_tr = compute_position_share_trend(team_u, "TE", trend_seasons)
    wr_tr = compute_position_share_trend(team_u, "WR", trend_seasons)
    rb_tr = compute_position_share_trend(team_u, "RB", trend_seasons)
    edge_tr = compute_position_share_trend(team_u, "EDGE", trend_seasons)

    # Expose TE target-share slope on scheme raw for TE scheme_fit (BUG 3 / audit JSON).
    scheme.setdefault("raw", {})["te_target_share_trend"] = float(te_tr)
    raw = scheme.get("raw") or {}

    policy = dict(needs_payload["need_signal_policy"])
    policy["trend_window_seasons"] = trend_seasons
    base_sources = list(policy.get("sources") or [])
    for s in (
        "nflverse_player_stats",
        "share_trend_linear_fit",
    ):
        if s not in base_sources:
            base_sources.append(s)
    policy["sources"] = base_sources

    picks = list(draft_pick_positions) if draft_pick_positions else []

    base_scores = {b: float(needs_payload["need_scores"].get(b, 0.0)) for b in NEED_BUCKETS}
    adjusted_scores = compute_adjusted_need_scores(team_u, int(season), base_scores)
    deltas = need_adjustment_deltas(base_scores, adjusted_scores)
    txn_bundle = load_transactions_json()
    all_moves = load_transactions_override()
    team_moves = [m for m in all_moves if m.to_team == team_u or m.from_team == team_u]
    moves_applied = 0
    for t in txn_bundle.get("transactions") or []:
        di = t.get("draft_need_impact")
        if isinstance(di, dict) and team_u in di:
            moves_applied += 1
            continue
        if str(t.get("to_team") or "").upper() == team_u or str(t.get("from_team") or "").upper() == team_u:
            moves_applied += 1
    if moves_applied == 0:
        net = txn_bundle.get("net_need_adjustments_by_team") or {}
        if isinstance(net, dict) and team_u in net and isinstance(net.get(team_u), dict):
            moves_applied = 1
    division_intel = build_division_intel(team_u, int(season))
    pick_changes = load_pick_changes()

    needs_payload["base_need_scores"] = base_scores
    needs_payload["adjusted_need_scores"] = adjusted_scores
    needs_payload["need_adjustments"] = deltas
    needs_payload["need_scores"] = adjusted_scores
    needs_payload["offseason_moves"] = [asdict(m) for m in team_moves]
    needs_payload["division_intel"] = division_intel
    needs_payload["pick_changes"] = pick_changes
    needs_payload["offseason_transaction_sources"] = load_transaction_sources()
    needs_payload["net_need_adjustments_by_team"] = txn_bundle.get("net_need_adjustments_by_team") or {}
    needs_payload["offseason_summary"] = offseason_summary_payload(
        base_scores, adjusted_scores, moves_applied=moves_applied
    )

    for s in ("offseason_context", "transactions_2026.json", "division_context.json"):
        if s not in base_sources:
            base_sources.append(s)
    policy["sources"] = base_sources
    needs_payload["need_signal_policy"] = policy

    return TeamContext(
        team=team_u,
        season=int(season),
        needs=adjusted_scores,
        needs_detail=needs_payload,
        scheme_profile=scheme,
        room_scores=room_scores,
        snap_depth=dict(layers.get("snap_depth_normalized") or {}),
        injury_pressure=dict(layers.get("injury_pressure_normalized") or {}),
        te_target_share_trend=te_tr,
        wr_target_share_trend=wr_tr,
        edge_pressure_trend=edge_tr,
        rb_target_share_trend=rb_tr,
        pass_rate=float(raw.get("off_pass_rate", 0.0)),
        shotgun_rate=float(raw.get("off_shotgun_rate", 0.0)),
        need_signal_policy=policy,
        draft_pick_positions=picks,
        base_need_scores=base_scores,
        need_adjustments=deltas,
        division_intel=division_intel,
        offseason_moves=team_moves,
        pick_changes=pick_changes,
    )


def team_context_summary(ctx: TeamContext) -> Dict[str, Any]:
    top = sorted(ctx.needs.items(), key=lambda x: -x[1])[:5]
    adj_lines: List[str] = []
    for b in NEED_BUCKETS:
        d = float(ctx.need_adjustments.get(b, 0.0))
        if abs(d) < 0.01:
            continue
        base_v = float(ctx.base_need_scores.get(b, 0.0))
        adj_v = float(ctx.needs.get(b, 0.0))
        adj_lines.append(f"{b}: {base_v:.1f} → {adj_v:.1f} ({d:+.1f})")
    return {
        "team": ctx.team,
        "season": ctx.season,
        "top_needs": [{"bucket": b, "score": round(v, 2)} for b, v in top],
        "scheme_highlights": {
            "pass_rate": round(ctx.pass_rate, 4),
            "shotgun_rate": round(ctx.shotgun_rate, 4),
            "te_target_share_trend": round(ctx.te_target_share_trend, 6),
            "wr_target_share_trend": round(ctx.wr_target_share_trend, 6),
            "edge_pressure_trend": round(ctx.edge_pressure_trend, 6),
        },
        "need_signal_policy": ctx.need_signal_policy,
        "draft_pick_positions": ctx.draft_pick_positions,
        "base_need_scores": {k: round(float(v), 2) for k, v in ctx.base_need_scores.items()},
        "need_adjustments": {k: round(float(v), 2) for k, v in ctx.need_adjustments.items()},
        "adjusted_need_scores": {k: round(float(v), 2) for k, v in ctx.needs.items()},
        "offseason_summary": (ctx.needs_detail or {}).get("offseason_summary") or {},
        "need_adjustment_lines": adj_lines,
    }
