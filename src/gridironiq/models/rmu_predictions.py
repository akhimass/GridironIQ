"""
RMU SAC hackathon + GridironIQ first-round pipeline (QB/WR/RB).

Train dual models on 2010–2024-style CSVs; score 2026 test prospects; write CSVs and plots.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from gridironiq.models.data_pipeline import (
    RB_FEATURES,
    WR_FEATURES,
    QB_FEATURES,
    clean_position_data,
    ensure_first_round_target,
    load_position_csv,
)
from gridironiq.models.first_round_model import (
    build_lr_model,
    build_xgb_model,
    evaluate_model,
    get_feature_importance,
    predict_first_round_prob,
)
from gridironiq.models.rmu_visualizations import (
    plot_combined_roc_figure,
    plot_confusion_matrix,
    plot_feature_importance,
    plot_r1_probabilities,
    plot_roc_curves,
)


def run_rmu_pipeline(
    data_dir: str = "data/rmu_sac",
    output_dir: str = "outputs/rmu_predictions",
    *,
    make_plots: bool = True,
) -> Dict[str, Any]:
    results: Dict[str, Any] = {}
    plot_dir = Path(output_dir) / "plots"
    plot_dir.mkdir(parents=True, exist_ok=True)
    roc_panels: list[tuple[str, Any, Any, pd.DataFrame, pd.Series]] = []

    for position in ["QB", "WR", "RB"]:
        print(f"\n{'=' * 50}")
        print(f"POSITION: {position}")
        print("=" * 50)

        train = load_position_csv(data_dir, position, "train")
        test = load_position_csv(data_dir, position, "test")
        train = ensure_first_round_target(train)

        train = clean_position_data(train, position)
        test = clean_position_data(test, position)

        features = {"QB": QB_FEATURES, "WR": WR_FEATURES, "RB": RB_FEATURES}[position]
        avail = [f for f in features if f in train.columns and f in test.columns]
        if not avail:
            raise ValueError(f"No overlapping features for {position}")

        X_train = train[avail].fillna(0)
        y_train = train["first_round"].astype(int)
        X_test = test[avail].fillna(0)

        X_plot, X_hold, y_plot, y_hold = train_test_split(
            X_train, y_train, test_size=0.25, random_state=42, stratify=y_train
        )
        lr_plot = build_lr_model(X_plot, y_plot)
        xgb_plot = build_xgb_model(X_plot, y_plot)

        lr_model = build_lr_model(X_train, y_train)
        xgb_model = build_xgb_model(X_train, y_train)

        lr_metrics = evaluate_model(lr_model, X_train, y_train, label=f"{position}_LR")
        xgb_metrics = evaluate_model(xgb_model, X_train, y_train, label=f"{position}_XGB")

        fi = get_feature_importance(lr_model, xgb_model, avail, position)

        probs = predict_first_round_prob(lr_model, xgb_model, X_test)

        out = test[["name", "college_team", "college_conference"]].copy()
        out["r1_probability"] = np.round(probs, 4)
        out["r1_predicted"] = (probs >= 0.50).astype(int)
        out["confidence"] = pd.cut(
            probs,
            bins=[0, 0.30, 0.55, 0.75, 1.01],
            labels=["LOW", "MEDIUM", "HIGH", "LOCK"],
        )
        out = out.sort_values("r1_probability", ascending=False)

        print(f"\n{position} PREDICTIONS:")
        print(out[["name", "r1_probability", "confidence"]].to_string(index=False))

        out_root = Path(output_dir)
        out_root.mkdir(parents=True, exist_ok=True)
        out.to_csv(out_root / f"{position.lower()}_predictions.csv", index=False)
        fi.to_csv(out_root / f"{position.lower()}_feature_importance.csv", index=False)

        if make_plots:
            plot_feature_importance(fi, position, plot_dir / f"{position.lower()}_feature_importance.png")
            plot_r1_probabilities(out, position, plot_dir / f"{position.lower()}_r1_probs.png")
            plot_confusion_matrix(lr_plot, X_hold, y_hold, position, plot_dir / f"{position.lower()}_confusion_lr.png")
            plot_confusion_matrix(xgb_plot, X_hold, y_hold, position, plot_dir / f"{position.lower()}_confusion_xgb.png")
            plot_roc_curves(lr_plot, xgb_plot, X_hold, y_hold, position, plot_dir / f"{position.lower()}_roc_curve.png")
            roc_panels.append((position, lr_plot, xgb_plot, X_hold, y_hold))

        results[position] = {
            "predictions": out,
            "feature_importance": fi,
            "lr_auc": lr_metrics["auc_mean"],
            "xgb_auc": xgb_metrics["auc_mean"],
        }

    if make_plots and roc_panels:
        plot_combined_roc_figure(roc_panels, plot_dir / "roc_curves.png")

    return results


def _cli() -> None:
    p = argparse.ArgumentParser(description="RMU SAC first-round models (QB/WR/RB).")
    p.add_argument("--data-dir", default="data/rmu_sac")
    p.add_argument("--output-dir", default="outputs/rmu_predictions")
    p.add_argument("--no-plots", action="store_true")
    args = p.parse_args()
    run_rmu_pipeline(data_dir=args.data_dir, output_dir=args.output_dir, make_plots=not args.no_plots)


if __name__ == "__main__":
    _cli()
