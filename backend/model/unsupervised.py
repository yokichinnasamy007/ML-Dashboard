"""
Unsupervised Learning — Indian Customer Spending Score Segmentation
-------------------------------------------------------------------
Dataset : Customer Spending Score (YBIFoundation / Kaggle Mall Customers — Indian edition)
          200 real customers with Annual Income and Spending Score (1-100)
          URL: https://raw.githubusercontent.com/YBIFoundation/Dataset/main/CustomerSpendingScore.csv
          Saved to: backend/data/customer_spending_score.csv
Model   : K-Means Clustering (k=5, sklearn)
Features: Annual Income (Rs.), Spending Score (1-100)
Saved   : backend/saved_models/unsupervised_model.joblib
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

from utils.preprocessing import load_customer_spending

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")
MODEL_PATH = os.path.join(MODELS_DIR, "unsupervised_model.joblib")

CLUSTER_NAMES = {
    0: "Budget Savers",
    1: "Careful Spenders",
    2: "Balanced Shoppers",
    3: "Generous Spenders",
    4: "Lavish Shoppers",
}
CLUSTER_DESC = {
    0: "Low income, low spenders — highly price-sensitive",
    1: "High income but restrained spenders — financially disciplined",
    2: "Average income and spending — the balanced middle class",
    3: "Low income but high spenders — enthusiastic shoppers on a budget",
    4: "High income and high spenders — premium and brand-loyal",
}


class CustomerClusterModel:
    def __init__(self, n_clusters: int = 5):
        self.n_clusters         = n_clusters
        self.kmeans             = KMeans(n_clusters=n_clusters, random_state=42, n_init=15)
        self.scaler             = StandardScaler()
        self.df:                pd.DataFrame = pd.DataFrame()
        self.metrics:           dict         = {}
        self.cluster_data:      list         = []
        self.centroid_positions:list         = []
        self.cluster_stats:     list         = []

    # ------------------------------------------------------------------
    def train(self):
        os.makedirs(MODELS_DIR, exist_ok=True)

        self.df = load_customer_spending()
        X = self.df[["Annual_Income", "Spending_Score"]].values
        X_scaled = self.scaler.fit_transform(X)

        labels    = self.kmeans.fit_predict(X_scaled)
        centroids = self.scaler.inverse_transform(self.kmeans.cluster_centers_)
        sil       = float(silhouette_score(X_scaled, labels))

        self.metrics = {
            "n_clusters":       self.n_clusters,
            "silhouette_score": round(sil, 4),
            "inertia":          round(float(self.kmeans.inertia_), 2),
            "n_samples":        int(len(self.df)),
            "dataset":          "Indian Customer Spending Score (YBIFoundation / Kaggle)",
            "features_used":    "Annual Income (Rs.), Spending Score (1-100)",
        }

        # Sort clusters by spending score ascending -> assign canonical names
        centroid_df = pd.DataFrame(centroids, columns=["income", "spending"])
        centroid_df["raw"] = range(self.n_clusters)
        sorted_c    = centroid_df.sort_values("spending").reset_index(drop=True)
        label_remap = {int(sorted_c.loc[i, "raw"]): i for i in range(self.n_clusters)}
        canonical   = [label_remap[int(l)] for l in labels]

        # All 200 points for the scatter chart
        self.cluster_data = []
        for i, row in self.df.iterrows():
            pt = {
                "x":       round(float(row["Annual_Income"]),  0),
                "y":       round(float(row["Spending_Score"]), 1),
                "cluster": int(canonical[i]),
            }
            if "Age" in self.df.columns: pt["age"]    = int(row["Age"])
            if "Sex" in self.df.columns: pt["gender"] = str(row["Sex"])
            self.cluster_data.append(pt)

        # Centroid positions
        self.centroid_positions = []
        for raw in range(self.n_clusters):
            canon = label_remap[raw]
            cx_income, cy_spending = centroids[raw]
            self.centroid_positions.append({
                "cluster": canon,
                "x":       round(float(cx_income),   0),
                "y":       round(float(cy_spending),  2),
                "name":    CLUSTER_NAMES.get(canon, f"Cluster {canon}"),
            })
        self.centroid_positions.sort(key=lambda d: d["cluster"])

        # Per-cluster statistics
        df_tmp = self.df[["Annual_Income", "Spending_Score"]].copy()
        df_tmp["cluster"] = canonical
        self.cluster_stats = []
        for c in range(self.n_clusters):
            grp = df_tmp[df_tmp["cluster"] == c]
            self.cluster_stats.append({
                "cluster":        c,
                "name":           CLUSTER_NAMES.get(c, f"Cluster {c}"),
                "description":    CLUSTER_DESC.get(c, ""),
                "count":          int(len(grp)),
                "avg_income":     round(float(grp["Annual_Income"].mean()),  0),
                "avg_spending":   round(float(grp["Spending_Score"].mean()), 1),
            })

        joblib.dump(
            {"kmeans": self.kmeans, "scaler": self.scaler, "label_remap": label_remap},
            MODEL_PATH,
        )
        print(
            f"[Unsupervised] trained — silhouette={sil:.4f}  "
            f"k={self.n_clusters}  rows={len(self.df)}  saved -> {MODEL_PATH}"
        )

    # ------------------------------------------------------------------
    def predict_cluster(self, annual_income: float, spending_score: float) -> dict:
        X_raw   = np.array([[annual_income, spending_score]])
        X_s     = self.scaler.transform(X_raw)
        raw_lbl = int(self.kmeans.predict(X_s)[0])

        centroids   = self.scaler.inverse_transform(self.kmeans.cluster_centers_)
        centroid_df = pd.DataFrame(centroids, columns=["income", "spending"])
        centroid_df["raw"] = range(self.n_clusters)
        sorted_c    = centroid_df.sort_values("spending").reset_index(drop=True)
        label_remap = {int(sorted_c.loc[i, "raw"]): i for i in range(self.n_clusters)}

        canon = label_remap[raw_lbl]
        return {
            "cluster":     canon,
            "name":        CLUSTER_NAMES.get(canon, f"Cluster {canon}"),
            "description": CLUSTER_DESC.get(canon, ""),
        }

    # ------------------------------------------------------------------
    def to_dict(self) -> dict:
        return {
            "metrics":   self.metrics,
            "points":    self.cluster_data,
            "centroids": self.centroid_positions,
            "stats":     self.cluster_stats,
        }

