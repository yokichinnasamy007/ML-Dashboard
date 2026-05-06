export default function MetricsCard({ metrics, type }) {
  if (!metrics) return null;

  const items =
    type === "supervised"
      ? [
          { label: "Model",          value: metrics.model_type,    fmt: (v) => v },
          { label: "Trees",          value: metrics.n_estimators,  fmt: (v) => v },
          { label: "R² Score",       value: metrics.r2_score,      fmt: (v) => v.toFixed(4) },
          { label: "RMSE",           value: metrics.rmse_inr,      fmt: (v) => `Rs.${Number(v).toLocaleString("en-IN")}` },
          { label: "MAE",            value: metrics.mae_inr,       fmt: (v) => `Rs.${Number(v).toLocaleString("en-IN")}` },
          { label: "Training rows",  value: metrics.n_train,       fmt: (v) => v.toLocaleString("en-IN") },
          { label: "Test rows",      value: metrics.n_test,        fmt: (v) => v.toLocaleString("en-IN") },
          { label: "Total listings", value: metrics.total_rows,    fmt: (v) => v.toLocaleString("en-IN") },
        ]
      : [
          { label: "Silhouette Score", value: metrics.silhouette_score, fmt: (v) => v.toFixed(4) },
          { label: "Clusters (k)",     value: metrics.n_clusters,       fmt: (v) => v },
          { label: "Inertia",          value: metrics.inertia,          fmt: (v) => v.toFixed(1) },
          { label: "Customers",        value: metrics.n_samples,        fmt: (v) => v },
          { label: "Features",         value: metrics.features_used,    fmt: (v) => v },
        ];

  return (
    <div className="metric-row">
      {items.map(({ label, value, fmt }) => (
        <div key={label} className="metric-chip">
          <span className="label">{label}</span>
          <span className="value">{value != null ? fmt(value) : "—"}</span>
        </div>
      ))}
    </div>
  );
}
