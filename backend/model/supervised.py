"""
Supervised Learning — Indian Used Car Selling Price Prediction
--------------------------------------------------------------
Dataset : Car Selling Price (YBIFoundation / Kaggle-origin)
          7,903 real Indian used car listings (Maruti, Honda, Hyundai, Skoda...)
          Saved to: backend/data/car_selling_price.csv
Model   : Random Forest Regressor (sklearn) — replaces Linear Regression
          n_estimators=300, n_jobs=-1, random_state=42
Target  : Selling Price in Indian Rupees (Rs.)
Saved   : backend/saved_models/supervised_model.joblib
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from utils.preprocessing import load_car_prices, get_feature_ranges

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")
MODEL_PATH = os.path.join(MODELS_DIR, "supervised_model.joblib")

FEATURE_NAMES = [
    "Car_Age", "KM_Driven", "Engine", "Max_Power", "Mileage",
    "Seats", "Fuel_Petrol", "Fuel_Diesel", "Is_Automatic",
    "Is_Dealer", "First_Owner",
]

FEATURE_LABELS = {
    "Car_Age":      "Car Age (years)",
    "KM_Driven":    "Kilometres Driven",
    "Engine":       "Engine Capacity (CC)",
    "Max_Power":    "Max Power (bhp)",
    "Mileage":      "Mileage (kmpl)",
    "Seats":        "Number of Seats",
    "Fuel_Petrol":  "Petrol (1=Yes / 0=No)",
    "Fuel_Diesel":  "Diesel (1=Yes / 0=No)",
    "Is_Automatic": "Automatic Transmission",
    "Is_Dealer":    "Dealer Seller",
    "First_Owner":  "First Owner",
}


class CarPriceModel:
    def __init__(self):
        # Random Forest does not need feature scaling — removed StandardScaler
        self.model = RandomForestRegressor(
            n_estimators=300,
            max_depth=None,          # grow fully — RF handles overfitting via bagging
            min_samples_split=5,
            min_samples_leaf=2,
            max_features="sqrt",     # standard for regression forests
            random_state=42,
            n_jobs=-1,               # use all CPU cores
        )
        self.feature_names  = FEATURE_NAMES
        self.metrics:        dict = {}
        self.feature_stats:  dict = {}
        self.sample_data:    dict = {}
        self.feature_importance: dict = {}

    # ------------------------------------------------------------------
    def train(self):
        os.makedirs(MODELS_DIR, exist_ok=True)

        df = load_car_prices()
        X  = df[FEATURE_NAMES]
        y  = df["Selling_Price"]          # INR

        self.feature_stats = get_feature_ranges(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Random Forest — no scaling required
        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)

        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2   = float(r2_score(y_test, y_pred))
        mae  = float(np.mean(np.abs(y_test.values - y_pred)))

        # OOB score for bonus evaluation (requires oob_score=True in constructor)
        # Skipped here to keep training fast; R2 on hold-out set is sufficient.

        self.metrics = {
            "r2_score":     round(r2,   4),
            "rmse_inr":     round(rmse, 0),
            "mae_inr":      round(mae,  0),
            "n_train":      int(len(X_train)),
            "n_test":       int(len(X_test)),
            "total_rows":   int(len(df)),
            "n_estimators": self.model.n_estimators,
            "dataset":      "Indian Used Car Selling Price (YBIFoundation / Kaggle)",
            "target_unit":  "INR (Rs.)",
            "model_type":   "Random Forest Regressor",
        }

        # Feature importance (Gini / mean decrease in impurity)
        importances = self.model.feature_importances_
        self.feature_importance = {
            feat: round(float(imp), 6)
            for feat, imp in zip(FEATURE_NAMES, importances)
        }

        # 300-point test-set sample for actual-vs-predicted scatter chart
        rng = np.random.default_rng(0)
        idx = rng.choice(len(X_test), size=min(300, len(X_test)), replace=False)
        self.sample_data = {
            "actual":    [round(float(v), 0) for v in y_test.iloc[idx].values],
            "predicted": [round(float(v), 0) for v in y_pred[idx]],
        }

        joblib.dump({"model": self.model}, MODEL_PATH)
        print(
            f"[Supervised] RandomForest trained — R2={r2:.4f}  "
            f"RMSE=Rs.{rmse:,.0f}  rows={len(df)}  "
            f"trees={self.model.n_estimators}  saved -> {MODEL_PATH}"
        )

    # ------------------------------------------------------------------
    def predict(self, features: dict) -> float:
        """Return predicted car selling price in INR."""
        row = pd.DataFrame(
            [[features.get(f, self.feature_stats[f]["mean"]) for f in FEATURE_NAMES]],
            columns=FEATURE_NAMES,
        )
        # No scaler needed for Random Forest
        return round(float(self.model.predict(row)[0]), 0)

    # ------------------------------------------------------------------
    def to_dict(self) -> dict:
        return {
            "feature_names":      self.feature_names,
            "feature_labels":     FEATURE_LABELS,
            "feature_stats":      self.feature_stats,
            "metrics":            self.metrics,
            "feature_importance": self.feature_importance,
            "sample_data":        self.sample_data,   # 300-pt test set for scatter chart
        }
