"""
Data loading utilities — real Indian datasets from YBIFoundation (GitHub public repo).

Supervised  : Indian Used Car Selling Price — 8,128 real car sales (Maruti, Honda, Hyundai…)
Unsupervised: Indian Customer Spending Score — 200 customers (Annual Income × Spending Score)

Raw CSVs are saved to backend/data/ so they are visible on disk.
"""

import io
import os
import re
import requests
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# ── Verified working public URLs (YBIFoundation Dataset GitHub repo) ──────────
CAR_URL         = "https://raw.githubusercontent.com/YBIFoundation/Dataset/main/Car%20Selling%20Price.csv"
CUSTOMERS_URL   = "https://raw.githubusercontent.com/YBIFoundation/Dataset/main/CustomerSpendingScore.csv"


def _download(url: str, local_path: str, label: str) -> str:
    """Download CSV once; re-use cached copy on subsequent runs."""
    os.makedirs(DATA_DIR, exist_ok=True)

    if os.path.exists(local_path):
        kb = os.path.getsize(local_path) // 1024
        print(f"[preprocessing] Using cached {label} ({kb} KB) -> {local_path}")
        return local_path

    print(f"[preprocessing] Downloading {label} from {url} …")
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    with open(local_path, "wb") as f:
        f.write(resp.content)
    print(f"[preprocessing] Saved {label} ({len(resp.content)//1024} KB) -> {local_path}")
    return local_path


# ─────────────────────────────────────────────────────────────────────────────
# Indian Used Car Selling Price dataset
# Columns: Brand, Year, Fuel, Transmission, Engine, Max_Power, Torque,
#          Seats, Mileage, KM_Driven, Owner, Seller_Type, Selling_Price
# ─────────────────────────────────────────────────────────────────────────────

def _extract_number(val) -> float | None:
    """Pull the first float out of strings like '1248 CC', '74.0 bhp', '23.4 kmpl'."""
    m = re.search(r"[\d]+\.?[\d]*", str(val))
    return float(m.group()) if m else np.nan


def load_car_prices() -> pd.DataFrame:
    path = _download(CAR_URL, os.path.join(DATA_DIR, "car_selling_price.csv"), "Indian Car Selling Price")
    df   = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]

    # Numeric columns that might carry unit suffixes
    for col in ["Engine", "Max_Power", "Mileage"]:
        if col in df.columns:
            df[col] = df[col].apply(_extract_number)

    df["KM_Driven"]   = pd.to_numeric(df.get("KM_Driven"),    errors="coerce")
    df["Seats"]        = pd.to_numeric(df.get("Seats"),         errors="coerce")
    df["Selling_Price"]= pd.to_numeric(df.get("Selling_Price"), errors="coerce")
    df["Year"]         = pd.to_numeric(df.get("Year"),           errors="coerce")
    df["Car_Age"]      = 2024 - df["Year"]

    # Encode categoricals
    df["Fuel_Petrol"]    = (df["Fuel"]        == "Petrol").astype(int)
    df["Fuel_Diesel"]    = (df["Fuel"]        == "Diesel").astype(int)
    df["Is_Automatic"]   = (df["Transmission"]== "Automatic").astype(int)
    df["Is_Dealer"]      = (df.get("Seller_Type", "") == "Dealer").astype(int)
    df["First_Owner"]    = (df.get("Owner", "") == "First Owner").astype(int)

    FEATURES = ["Car_Age", "KM_Driven", "Engine", "Max_Power", "Mileage",
                "Seats", "Fuel_Petrol", "Fuel_Diesel", "Is_Automatic",
                "Is_Dealer", "First_Owner"]

    df = df.dropna(subset=FEATURES + ["Selling_Price"])
    df = df[(df["Selling_Price"] > 10_000) & (df["Selling_Price"] < 10_000_000)]
    df = df[(df["KM_Driven"]     > 0)      & (df["KM_Driven"]     < 1_000_000)]
    df = df[(df["Car_Age"]       >= 0)     & (df["Car_Age"]        <= 30)]
    df = df.reset_index(drop=True)

    print(f"[preprocessing] Car Prices cleaned: {len(df)} rows")
    return df[FEATURES + ["Selling_Price", "Brand"]]


# ─────────────────────────────────────────────────────────────────────────────
# Indian Customer Spending Score dataset
# Columns: Sex, Gender, Age, Annual Income(1,000s), Spending Score (1-100)
# ─────────────────────────────────────────────────────────────────────────────

def load_customer_spending() -> pd.DataFrame:
    path = _download(CUSTOMERS_URL, os.path.join(DATA_DIR, "customer_spending_score.csv"), "Customer Spending Score")
    df   = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]

    income_col   = next(c for c in df.columns if "income"  in c.lower())
    spending_col = next(c for c in df.columns if "spending" in c.lower())

    df["Annual_Income"]  = pd.to_numeric(df[income_col],   errors="coerce")
    df["Spending_Score"] = pd.to_numeric(df[spending_col], errors="coerce")

    df = df.dropna(subset=["Annual_Income", "Spending_Score"])
    df = df.reset_index(drop=True)

    keep = ["Annual_Income", "Spending_Score"]
    for extra in ["Age", "Sex", "Gender"]:
        if extra in df.columns:
            keep.append(extra)

    print(f"[preprocessing] Customer Spending cleaned: {len(df)} rows")
    return df[keep]


# ─────────────────────────────────────────────────────────────────────────────
def get_feature_ranges(X: pd.DataFrame) -> dict:
    return {
        col: {
            "min":  round(float(X[col].min()),  2),
            "max":  round(float(X[col].max()),  2),
            "mean": round(float(X[col].mean()), 2),
        }
        for col in X.select_dtypes("number").columns
    }

