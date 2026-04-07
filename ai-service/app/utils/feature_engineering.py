"""
Feature Engineering Utilities — Smart Parking.

Placeholder functions for creating ML features from raw parking data.
TODO: Implement each function once dataset schema is confirmed.
"""

import logging
import math
from typing import Any

logger = logging.getLogger(__name__)


def add_temporal_features(data: Any) -> Any:
    """
    Add time-based features from timestamp column.

    Features created:
        - hour_of_day (0-23)
        - day_of_week (0-6)
        - month (1-12)
        - is_weekend (0/1)
        - is_peak_hour (0/1) — 7-9 AM, 5-7 PM
        - hour_sin, hour_cos — cyclic encoding

    TODO: Implement with pandas:
        df["hour_of_day"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["hour_sin"] = df["hour_of_day"].apply(lambda h: math.sin(2*math.pi*h/24))
        df["hour_cos"] = df["hour_of_day"].apply(lambda h: math.cos(2*math.pi*h/24))
    """
    logger.info("Adding temporal features — placeholder")
    return data


def add_lag_features(
    data: Any,
    column: str = "is_occupied",
    lags: list[int] | None = None,
) -> Any:
    """
    Add lag (autoregressive) features for time-series modeling.

    Args:
        data: Dataset with time-ordered rows.
        column: Column to create lags from.
        lags: List of lag steps (default: [1, 2, 3, 6, 12, 24]).

    Features created:
        - occupancy_lag_1 (previous reading)
        - occupancy_lag_3 (3 readings ago)
        - occupancy_lag_24 (same hour yesterday)

    TODO: Implement with pandas shift():
        for lag in lags:
            df[f"{column}_lag_{lag}"] = df[column].shift(lag)
    """
    if lags is None:
        lags = [1, 2, 3, 6, 12, 24]

    logger.info("Adding lag features %s — placeholder", lags)
    return data


def add_rolling_features(
    data: Any,
    column: str = "is_occupied",
    windows: list[int] | None = None,
) -> Any:
    """
    Add rolling window statistics for capturing trends.

    Args:
        data: Dataset with time-ordered rows.
        column: Column to compute rolling stats from.
        windows: Window sizes in readings (default: [6, 12, 24]).

    Features created:
        - rolling_mean_6h, rolling_std_6h
        - rolling_mean_12h, rolling_std_12h
        - rolling_mean_24h, rolling_max_24h

    TODO: Implement with pandas rolling():
        for w in windows:
            df[f"{column}_rolling_mean_{w}"] = df[column].rolling(w).mean()
            df[f"{column}_rolling_std_{w}"] = df[column].rolling(w).std()
    """
    if windows is None:
        windows = [6, 12, 24]

    logger.info("Adding rolling features %s — placeholder", windows)
    return data


def add_external_features(data: Any) -> Any:
    """
    Add external context features (weather, events, holidays).

    Features created:
        - weather_encoded (one-hot: sunny, rain, cloudy, snow)
        - is_holiday (0/1)
        - event_indicator (0/1)
        - traffic_volume (if available)

    TODO: Implement by joining external data sources.
    """
    logger.info("Adding external features — placeholder")
    return data


def create_target(data: Any, target_column: str = "is_occupied", horizon: int = 1) -> tuple[Any, Any]:
    """
    Create the target variable for supervised learning.

    For demand prediction:
        Target = occupancy rate at (current_time + horizon)

    Args:
        data: Dataset with time-ordered rows.
        target_column: Column to use as base for target.
        horizon: How many steps ahead to predict.

    Returns:
        Tuple of (features, target).

    TODO: Implement with pandas shift:
        y = data[target_column].shift(-horizon)
        X = data.drop(columns=[target_column])
    """
    logger.info("Creating target variable (horizon=%d) — placeholder", horizon)
    return data, data


def build_feature_set(data: Any) -> tuple[Any, Any]:
    """
    Run the full feature engineering pipeline.

    Steps:
        1. Temporal features
        2. Lag features
        3. Rolling features
        4. External features
        5. Create target

    Args:
        data: Preprocessed dataset.

    Returns:
        Tuple of (X features, y target).
    """
    logger.info("Building full feature set...")

    data = add_temporal_features(data)
    data = add_lag_features(data)
    data = add_rolling_features(data)
    data = add_external_features(data)
    X, y = create_target(data)

    logger.info("Feature set built — placeholder")
    return X, y
