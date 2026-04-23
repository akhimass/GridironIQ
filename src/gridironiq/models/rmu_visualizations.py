"""RMU SAC presentation charts — feature importance, R1 probabilities, confusion, ROC."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import ConfusionMatrixDisplay, RocCurveDisplay


def plot_feature_importance(fi_df: pd.DataFrame, position: str, save_path: str | Path) -> None:
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    fig.set_facecolor("#050709")

    top10 = fi_df.head(10).copy()
    colors = ["#d4a843" if c > 0 else "#e05252" for c in top10["lr_coef"].fillna(0)]
    ax1.barh(top10["feature"], top10["lr_coef"].abs(), color=colors)
    ax1.set_title(f"{position} — Logistic Regression", color="white", fontsize=11)
    ax1.set_facecolor("#0a0d14")
    ax1.tick_params(colors="#7d8fa8")
    for s in ax1.spines.values():
        s.set_color("#ffffff11")

    ax2.barh(top10["feature"], top10["xgb_gain"].fillna(0), color="#29b8e0")
    ax2.set_title(f"{position} — XGBoost gain", color="white", fontsize=11)
    ax2.set_facecolor("#0a0d14")
    ax2.tick_params(colors="#7d8fa8")
    for s in ax2.spines.values():
        s.set_color("#ffffff11")

    plt.tight_layout()
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, facecolor="#050709", dpi=150)
    plt.close()
    print(f"Saved: {save_path}")


def plot_r1_probabilities(predictions_df: pd.DataFrame, position: str, save_path: str | Path) -> None:
    df = predictions_df.sort_values("r1_probability", ascending=True).copy()
    colors = df["r1_probability"].apply(
        lambda p: "#3ecf7a" if p > 0.70 else "#d4a843" if p > 0.40 else "#3d4f66"
    )

    fig_h = max(6.0, len(df) * 0.35)
    fig, ax = plt.subplots(figsize=(10, fig_h))
    fig.set_facecolor("#050709")
    ax.set_facecolor("#0a0d14")

    ax.barh(df["name"], df["r1_probability"], color=list(colors))
    ax.axvline(0.50, color="#e05252", linestyle="--", linewidth=1, alpha=0.8, label="50% threshold")
    ax.set_xlabel("R1 probability", color="#7d8fa8")
    ax.set_title(f"{position} — 2026 first-round probability", color="white", fontsize=13)
    ax.tick_params(colors="#7d8fa8")
    for s in ax.spines.values():
        s.set_color("#ffffff11")
    ax.legend(facecolor="#0a0d14", edgecolor="#ffffff11", labelcolor="white")

    plt.tight_layout()
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, facecolor="#050709", dpi=150)
    plt.close()
    print(f"Saved: {save_path}")


def plot_confusion_matrix(
    model: Any,
    X_test: np.ndarray | pd.DataFrame,
    y_test: np.ndarray | pd.Series,
    position: str,
    save_path: str | Path,
) -> None:
    fig, ax = plt.subplots(figsize=(6, 5))
    disp = ConfusionMatrixDisplay.from_estimator(
        model,
        X_test,
        y_test,
        display_labels=["Not R1", "R1"],
        cmap="YlOrBr",
        ax=ax,
    )
    disp.ax_.set_title(f"{position} — holdout confusion")
    plt.tight_layout()
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"Saved: {save_path}")


def plot_roc_curves(
    lr_model: Any,
    xgb_model: Any,
    X_test: np.ndarray | pd.DataFrame,
    y_test: np.ndarray | pd.Series,
    position: str,
    save_path: str | Path,
) -> None:
    fig, ax = plt.subplots(figsize=(8, 6))
    fig.set_facecolor("#050709")
    ax.set_facecolor("#0a0d14")

    RocCurveDisplay.from_estimator(lr_model, X_test, y_test, name="Logistic regression", ax=ax, color="#d4a843")
    RocCurveDisplay.from_estimator(xgb_model, X_test, y_test, name="XGBoost", ax=ax, color="#29b8e0")
    ax.set_title(f"{position} — ROC (holdout)", color="white")
    ax.tick_params(colors="#7d8fa8")
    for s in ax.spines.values():
        s.set_color("#ffffff11")
    ax.legend(facecolor="#0a0d14", labelcolor="white")

    plt.tight_layout()
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, facecolor="#050709", dpi=150)
    plt.close()
    print(f"Saved: {save_path}")


def plot_combined_roc_figure(
    panels: list[tuple[str, Any, Any, np.ndarray | pd.DataFrame, np.ndarray | pd.Series]],
    save_path: str | Path,
) -> None:
    """``panels``: list of (position, lr, xgb, X_hold, y_hold)."""
    n = len(panels)
    fig, axes = plt.subplots(1, n, figsize=(5 * n, 5), squeeze=False)
    fig.set_facecolor("#050709")
    axes_flat = axes.ravel()
    for i, (pos, lr_m, xgb_m, Xh, yh) in enumerate(panels):
        ax = axes_flat[i]
        ax.set_facecolor("#0a0d14")
        RocCurveDisplay.from_estimator(lr_m, Xh, yh, name="LR", ax=ax, color="#d4a843")
        RocCurveDisplay.from_estimator(xgb_m, Xh, yh, name="XGB", ax=ax, color="#29b8e0")
        ax.set_title(f"{pos}", color="white")
        ax.tick_params(colors="#7d8fa8")
        for s in ax.spines.values():
            s.set_color("#ffffff11")
        ax.legend(facecolor="#0a0d14", labelcolor="white", fontsize=8)
    plt.tight_layout()
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, facecolor="#050709", dpi=150)
    plt.close()
    print(f"Saved: {save_path}")
