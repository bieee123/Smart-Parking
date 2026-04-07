"""
Demand Prediction Model — Placeholder for Smart Parking.

This class wraps the ML model (or baseline heuristic) used to predict
parking demand / occupancy rates.

TODO: Replace the mock logic with a real trained model once dataset arrives.
      Supported formats: pickle (.pkl), joblib (.joblib), ONNX (.onnx)
"""

import os
import json
import logging
import math
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ── Default paths ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # ai-service/
DEFAULT_MODEL_DIR = BASE_DIR / "models"
DEFAULT_MODEL_PATH = DEFAULT_MODEL_DIR / "prediction_model.pkl"
DEFAULT_METADATA_PATH = DEFAULT_MODEL_DIR / "prediction_metadata.json"

# ── Model metadata (editable) ─────────────────────────────────────────────────
MODEL_METADATA = {
    "version": "0.1.0",
    "model_type": "placeholder-baseline",          # Will become "lstm", "xgboost", etc.
    "last_trained": None,                          # ISO timestamp
    "required_features": [
        "hour_of_day",
        "day_of_week",
        "occupancy_history",
        "traffic_volume",
    ],
    "target": "occupancy_rate",                    # What the model predicts
    "prediction_unit": "rate",                     # "rate" (0-1) or "count"
    "description": "Baseline heuristic — replace with trained model",
}


class PredictionModel:
    """
    Placeholder ML model for parking demand prediction.

    Public API:
        load_model()      — load from disk (pickle / joblib / onnx)
        save_model()      — persist trained model
        predict()         — single inference (hourly horizon)
        predict_daily()   — 24-hour forecast
        predict_weekly()  — 7-day forecast
        get_metadata()    — return model metadata dict
        health_check()    — {loaded: bool, version: str, ...}
    """

    def __init__(
        self,
        model_path: str = DEFAULT_MODEL_PATH,
        metadata_path: str = DEFAULT_METADATA_PATH,
    ):
        self.model_path = str(model_path)
        self.metadata_path = str(metadata_path)
        self.model: Optional[object] = None
        self.metadata = self._load_metadata()

    # ── Metadata ──────────────────────────────────────────────────────────────

    def _load_metadata(self) -> dict:
        """Load model metadata from JSON file, fall back to defaults."""
        if os.path.isfile(self.metadata_path):
            try:
                with open(self.metadata_path, "r") as f:
                    return json.load(f)
            except Exception as exc:
                logger.warning("Failed to load metadata from %s: %s — using defaults", self.metadata_path, exc)
        return MODEL_METADATA.copy()

    def save_metadata(self) -> None:
        """Persist current metadata to disk."""
        os.makedirs(os.path.dirname(self.metadata_path) or ".", exist_ok=True)
        with open(self.metadata_path, "w") as f:
            json.dump(self.metadata, f, indent=2)
        logger.info("Model metadata saved to %s", self.metadata_path)

    def get_metadata(self) -> dict:
        """Return a copy of the current metadata."""
        return self.metadata.copy()

    # ── Model persistence ─────────────────────────────────────────────────────

    def load_model(self) -> bool:
        """
        Load trained model from disk.

        Supports:
          - pickle / joblib (.pkl, .joblib)
          - ONNX (.onnx)

        Returns True if model loaded successfully, False otherwise.
        """
        if not os.path.isfile(self.model_path):
            logger.warning("Prediction model not found at %s — using baseline heuristic", self.model_path)
            self.model = None
            return False

        try:
            ext = os.path.splitext(self.model_path)[1].lower()

            if ext in (".pkl", ".joblib"):
                import joblib
                self.model = joblib.load(self.model_path)
                logger.info("Prediction model loaded from %s", self.model_path)

            elif ext == ".onnx":
                import onnxruntime as ort
                self.model = ort.InferenceSession(self.model_path)
                logger.info("ONNX prediction model loaded from %s", self.model_path)

            else:
                raise ValueError(f"Unsupported model format: {ext}")

            return True

        except Exception as exc:
            logger.error("Failed to load prediction model: %s — falling back to baseline", exc)
            self.model = None
            return False

    def save_model(self, model_obj: object = None) -> None:
        """
        Save the trained model to disk using joblib.

        Args:
            model_obj: The trained model object (sklearn, xgboost, etc.).
                       If None, saves nothing (only metadata).
        """
        if model_obj is None:
            logger.warning("No model object provided — skipping save")
            return

        os.makedirs(os.path.dirname(self.model_path) or ".", exist_ok=True)

        try:
            import joblib
            joblib.dump(model_obj, self.model_path)
            logger.info("Model saved to %s", self.model_path)
        except Exception as exc:
            logger.error("Failed to save model: %s", exc)

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict(self, hour: int, horizon: int = 3, history: Optional[list] = None) -> list[float]:
        """
        Predict occupancy rate for the next *horizon* hours starting from *hour*.

        Args:
            hour: Current hour of day (0-23).
            horizon: Number of hours ahead to predict (1-24).
            history: Optional list of recent occupancy rates for context.

        Returns:
            List of occupancy rates (0.0 – 1.0) for each future hour.
        """
        horizon = max(1, min(horizon, 24))

        if self.model is not None:
            return self._predict_with_model(hour, horizon, history)

        # TODO: Replace with real model inference once trained
        return self._baseline_predict(hour, horizon, history)

    def _predict_with_model(self, hour: int, horizon: int, history: Optional[list] = None) -> list[float]:
        """
        Run inference through the loaded trained model.

        TODO: Adjust feature engineering to match your model's training pipeline.
              This is a placeholder showing how features would be constructed.
        """
        import numpy as np

        predictions = []
        for h in range(1, horizon + 1):
            future_hour = (hour + h) % 24

            # ── TODO: Replace with actual feature engineering ──
            # Example features (must match training schema):
            features = np.array([[
                math.sin(2 * math.pi * future_hour / 24),   # hour cyclic encoding
                math.cos(2 * math.pi * future_hour / 24),
                1.0 if future_hour >= 18 or future_hour < 6 else 0.0,  # is_night
                history[-1] if history else 0.5,             # last known occupancy
            ]])

            # ONNX or sklearn inference
            if hasattr(self.model, "predict"):
                pred = self.model.predict(features)[0]
            else:
                # ONNX runtime
                input_name = self.model.get_inputs()[0].name
                pred = self.model.run(None, {input_name: features})[0][0]

            predictions.append(float(max(0.0, min(1.0, pred))))

        return predictions

    def _baseline_predict(self, hour: int, horizon: int, history: Optional[list] = None) -> list[float]:
        """
        Realistic heuristic baseline that mimics daily parking patterns.

        Pattern profile (occupancy rate per hour):
          - Night (0-5 AM):    0.08 – 0.15
          - Morning ramp (6-9): 0.25 – 0.65
          - Peak (10-16):      0.75 – 0.92
          - Evening (17-21):   0.50 – 0.75
          - Night (22-23):     0.18 – 0.25

        Args:
            hour: Current hour (0-23).
            horizon: Hours ahead (1-24).
            history: Optional recent readings to nudge predictions.

        Returns:
            List of occupancy rates.
        """
        # Realistic base occupancy profile per hour of day
        base_profile = {
            0: 0.15, 1: 0.12, 2: 0.10, 3: 0.08, 4: 0.10, 5: 0.15,
            6: 0.25, 7: 0.40, 8: 0.55, 9: 0.65,
            10: 0.75, 11: 0.82, 12: 0.88, 13: 0.90, 14: 0.92, 15: 0.88,
            16: 0.82, 17: 0.75, 18: 0.65, 19: 0.50,
            20: 0.40, 21: 0.32, 22: 0.25, 23: 0.18,
        }

        # Use history to slightly adjust baseline
        history_nudge = 0.0
        if history and len(history) > 0:
            recent_avg = sum(history[-3:]) / min(3, len(history))
            baseline_avg = sum(base_profile.values()) / 24
            history_nudge = (recent_avg - baseline_avg) * 0.3  # dampened influence

        predictions = []
        for h in range(1, horizon + 1):
            future_hour = (hour + h) % 24
            base = base_profile[future_hour]
            variation = random.uniform(-0.03, 0.03)
            occupancy = max(0.0, min(1.0, base + variation + history_nudge))
            predictions.append(round(occupancy, 4))

        return predictions

    def predict_daily(self, history: Optional[list] = None) -> list[float]:
        """
        Predict occupancy for the next 24 hours starting from now.

        Returns:
            List of 24 occupancy rates.
        """
        current_hour = datetime.now().hour
        return self.predict(hour=current_hour, horizon=24, history=history)

    def predict_weekly(self, history: Optional[list] = None) -> list[float]:
        """
        Predict daily average occupancy for the next 7 days.

        Returns:
            List of 7 daily average occupancy rates.
        """
        # Simple approach: 24h predictions aggregated per day
        daily_predictions = []
        current_hour = datetime.now().hour

        for day in range(7):
            day_preds = self.predict(
                hour=current_hour if day == 0 else 0,
                horizon=24,
                history=history,
            )
            daily_avg = sum(day_preds) / len(day_preds) if day_preds else 0.0
            daily_predictions.append(round(daily_avg, 4))
            # Use last day's avg as "history" for next day
            history = [daily_avg]

        return daily_predictions

    # ── Health check ──────────────────────────────────────────────────────────

    def health_check(self) -> dict:
        """Return model health status."""
        return {
            "loaded": self.model is not None,
            "model_type": self.metadata.get("model_type", "unknown"),
            "version": self.metadata.get("version", "0.0.0"),
            "last_trained": self.metadata.get("last_trained"),
            "required_features": self.metadata.get("required_features", []),
            "model_path": self.model_path,
            "model_exists": os.path.isfile(self.model_path),
        }


# ── Singleton instance ────────────────────────────────────────────────────────

prediction_model = PredictionModel()
