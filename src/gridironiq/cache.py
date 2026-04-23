"""
JSON on-disk cache for expensive draft pipeline outputs (Render / low-RAM hosts).

Used by API routes to avoid re-running full nflverse-backed ``build_draft_board`` on every request.
"""

from __future__ import annotations

import hashlib
import json
import pathlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence

CACHE_DIR = pathlib.Path("outputs/cache")
CACHE_TTL_HOURS = 24.0


def _ensure_cache_dir() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def draft_board_cache_key(
    team: str,
    combine_season: int,
    eval_season: int,
    *,
    picks: Optional[Sequence[int]] = None,
    consensus_dirs: Optional[str] = None,
    cfb_season: Optional[int] = None,
) -> str:
    p = "_".join(str(x) for x in sorted(picks or []))
    extra = (consensus_dirs or "").strip()
    cfb = "" if cfb_season is None else str(int(cfb_season))
    raw = f"board|{team.upper()}|{combine_season}|{eval_season}|{p}|{extra}|cfb:{cfb}"
    return hashlib.md5(raw.encode(), usedforsecurity=False).hexdigest()[:12]


def draft_report_cache_key(
    team: str,
    season: int,
    picks: Sequence[int],
    top_n: int,
    report_type: str,
    use_ai: bool,
    prospect_name: str,
) -> str:
    p = "_".join(str(x) for x in sorted(picks))
    raw = f"report|{team.upper()}|{season}|{p}|{top_n}|{report_type}|{int(use_ai)}|{prospect_name.strip()}"
    return hashlib.md5(raw.encode(), usedforsecurity=False).hexdigest()[:12]


def _cache_path(key: str) -> pathlib.Path:
    return CACHE_DIR / f"{key}.json"


def read_cache(key: str) -> Optional[Dict[str, Any]]:
    _ensure_cache_dir()
    path = _cache_path(key)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    ts = float(data.pop("_cached_at_ts", 0) or 0)
    if ts <= 0:
        return None
    age_hours = (datetime.now(timezone.utc).timestamp() - ts) / 3600.0
    if age_hours >= CACHE_TTL_HOURS:
        return None
    return data


def write_cache(key: str, payload: Dict[str, Any]) -> None:
    _ensure_cache_dir()
    out = dict(payload)
    out["_cached_at_ts"] = datetime.now(timezone.utc).timestamp()
    text = json.dumps(out, ensure_ascii=False, default=str, indent=2)
    _cache_path(key).write_text(text, encoding="utf-8")


def cache_file_count() -> int:
    _ensure_cache_dir()
    return len(list(CACHE_DIR.glob("*.json")))
