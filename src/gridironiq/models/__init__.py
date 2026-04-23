"""GridironIQ predictive models (v2).

This package implements a multi-layer prediction stack:
- Stable team efficiency features (EPA/success/explosive/etc.)
- Matchup feature builder (offense vs defense differentials, context)
- Separate win probability, margin, and total models

The legacy 5 Keys system remains in superbowlengine and is used primarily for
explainability/scouting report layers, not as the sole predictive backbone.

RMU SAC / first-round skill models (QB/WR/RB) live in ``data_pipeline``,
``first_round_model``, and ``rmu_predictions`` (CSV + matplotlib deliverables).
"""

