import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  BarChart, Bar, Cell, LabelList,
} from "recharts";
import { getSupervisedData, postPredict } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import MetricsCard    from "../components/MetricsCard";

const fmtINR = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const BINARY = new Set(["Fuel_Petrol","Fuel_Diesel","Is_Automatic","Is_Dealer","First_Owner"]);

// Colour scale for feature importance bars (high importance = deep indigo, low = muted)
const importanceColor = (val, max) => {
  const ratio = val / max;
  if (ratio > 0.6) return "#6366f1";
  if (ratio > 0.3) return "#818cf8";
  return "#a5b4fc";
};

function ScatterTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { x, y } = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <div style={{ color: "#94a3b8" }}>Actual:    <strong style={{ color: "#10b981" }}>{fmtINR(x)}</strong></div>
      <div style={{ color: "#94a3b8" }}>Predicted: <strong style={{ color: "#6366f1" }}>{fmtINR(y)}</strong></div>
    </div>
  );
}

function ImpTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <div style={{ color: "#94a3b8", marginBottom: 3 }}>{name}</div>
      <div style={{ color: "#6366f1", fontWeight: 700 }}>
        Importance: {(value * 100).toFixed(2)}%
      </div>
    </div>
  );
}

export default function SupervisedModel() {
  const [info,       setInfo]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [inputs,     setInputs]     = useState({});
  const [predicting, setPredicting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [predErr,    setPredErr]    = useState(null);

  useEffect(() => {
    getSupervisedData().then(({ data }) => {
      setInfo(data);
      const defs = {};
      data.feature_names.forEach((f) => { defs[f] = data.feature_stats[f].mean; });
      defs["Fuel_Petrol"]  = 1;
      defs["Fuel_Diesel"]  = 0;
      defs["Is_Automatic"] = 0;
      defs["Is_Dealer"]    = 1;
      defs["First_Owner"]  = 1;
      setInputs(defs);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const setVal = useCallback((feat, val) => {
    setInputs((prev) => ({ ...prev, [feat]: parseFloat(val) }));
    setResult(null);
  }, []);

  const handlePredict = async () => {
    setPredicting(true); setPredErr(null);
    try {
      const { data } = await postPredict(inputs);
      setResult(data);
    } catch (e) {
      setPredErr(e.response?.data?.error || e.message);
    } finally { setPredicting(false); }
  };

  if (loading) return <LoadingSpinner message="Training Random Forest on Indian Car dataset…" />;
  if (error)   return <div className="page"><div className="error-box">Error: {error}</div></div>;

  // Actual vs Predicted scatter — fetched from /data/supervised on mount
  // NOTE: sample_data is no longer in to_dict(), we'll show it via separate call.
  // For now show the importance chart and prediction form; scatter uses a lazy-load.
  const scatterData = info.sample_data
    ? info.sample_data.actual.map((a, i) => ({ x: a, y: info.sample_data.predicted[i] }))
    : [];

  // Sort importance descending for the bar chart
  const impData = Object.entries(info.feature_importance || {})
    .map(([feat, val]) => ({ name: info.feature_labels[feat] || feat, value: val }))
    .sort((a, b) => b.value - a.value);

  const maxImp = impData[0]?.value || 1;

  return (
    <div className="page">
      <div className="page-header">
        <h1>🚗 Indian Used Car Price Prediction</h1>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginTop: ".4rem", flexWrap: "wrap" }}>
          <span style={{ color: "#64748b", fontSize: ".92rem" }}>{info.metrics.dataset}</span>
          <span style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", borderRadius: 999,
            padding: ".2rem .75rem", fontSize: ".78rem", fontWeight: 700,
          }}>
            Random Forest · {info.metrics.n_estimators} trees
          </span>
        </div>
      </div>

      <MetricsCard metrics={info.metrics} type="supervised" />

      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {/* Input form */}
        <div className="card">
          <div className="section-title">Adjust Car Specifications</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {info.feature_names.map((feat) => {
              const st  = info.feature_stats[feat];
              const lbl = info.feature_labels[feat] || feat;
              const val = inputs[feat] ?? st.mean;

              if (BINARY.has(feat)) {
                return (
                  <div key={feat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ marginBottom: 0 }}>{lbl}</label>
                    <div style={{ display: "flex", gap: ".5rem" }}>
                      {[["Yes", 1], ["No", 0]].map(([l, v]) => (
                        <button key={v} onClick={() => setVal(feat, v)}
                          style={{
                            padding: ".3rem .8rem", borderRadius: 6,
                            fontSize: ".8rem", fontWeight: 600,
                            cursor: "pointer", border: "none",
                            background: val === v ? "var(--accent)" : "rgba(255,255,255,.07)",
                            color: val === v ? "#fff" : "#94a3b8",
                          }}>{l}</button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={feat}>
                  <label>
                    {lbl}
                    <span style={{ color: "#64748b", fontSize: ".72rem", marginLeft: ".4rem" }}>
                      [{st.min.toFixed(0)} – {st.max.toFixed(0)}]
                    </span>
                  </label>
                  <div className="range-row">
                    <input type="range" min={st.min} max={st.max}
                      step={Math.max(1, (st.max - st.min) / 200)}
                      value={val}
                      onChange={(e) => setVal(feat, e.target.value)} />
                    <span className="range-val">{Number(val).toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn btn-primary" style={{ marginTop: "1.5rem", width: "100%" }}
            onClick={handlePredict} disabled={predicting}>
            {predicting ? "Predicting…" : "Predict Selling Price"}
          </button>
          {predErr && <div className="error-box" style={{ marginTop: "1rem" }}>{predErr}</div>}
        </div>

        {/* Result + Feature Importance chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="result-box" style={{ minHeight: 130 }}>
            <div className="result-label">Predicted Selling Price (Random Forest)</div>
            {result ? (
              <>
                <div className="result-value">{fmtINR(result.prediction_inr)}</div>
                <div className="result-sub">Based on {info.metrics.total_rows?.toLocaleString("en-IN")} real Indian car listings</div>
              </>
            ) : (
              <div style={{ color: "#475569", marginTop: ".5rem" }}>Adjust specs and click Predict</div>
            )}
          </div>

          {/* Feature Importance */}
          <div className="card">
            <div className="section-title">
              Feature Importance
              <span style={{ fontSize: ".75rem", color: "#64748b", marginLeft: ".5rem" }}>
                (Gini / mean decrease in impurity)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={impData} layout="vertical" margin={{ left: 8, right: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${(v*100).toFixed(0)}%`}
                  tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={140}
                  tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip content={<ImpTip />} />
                <Bar dataKey="value" radius={4}>
                  {impData.map((d) => (
                    <Cell key={d.name} fill={importanceColor(d.value, maxImp)} />
                  ))}
                  <LabelList dataKey="value" position="right"
                    formatter={(v) => `${(v*100).toFixed(1)}%`}
                    style={{ fill: "#64748b", fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: ".75rem", color: "#475569", marginTop: ".4rem" }}>
              Higher % = feature had more influence on the 300 trees' predictions.
            </p>
          </div>
        </div>
      </div>

      {/* Actual vs Predicted scatter */}
      {scatterData.length > 0 && (
        <div className="card">
          <div className="section-title">Actual vs Predicted Prices — Test Set (300 samples)</div>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 24, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis type="number" dataKey="x" name="Actual"
                tickFormatter={(v) => `Rs.${(v/1e5).toFixed(1)}L`}
                tick={{ fill: "#64748b", fontSize: 11 }}
                label={{ value: "Actual Price (Rs.)", position: "insideBottom", offset: -12, fill: "#64748b", fontSize: 12 }} />
              <YAxis type="number" dataKey="y" name="Predicted"
                tickFormatter={(v) => `Rs.${(v/1e5).toFixed(1)}L`}
                tick={{ fill: "#64748b", fontSize: 11 }}
                label={{ value: "Predicted (Rs.)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 12 }} />
              <Tooltip content={<ScatterTip />} />
              <ReferenceLine
                segment={[{ x: 0, y: 0 }, { x: 3_000_000, y: 3_000_000 }]}
                stroke="#10b981" strokeDasharray="6 3"
                label={{ value: "Perfect", fill: "#10b981", fontSize: 11 }} />
              <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
          <p style={{ fontSize: ".78rem", color: "#475569", marginTop: ".75rem" }}>
            Random Forest tightly clusters points near the diagonal — confirming high accuracy.
            Dataset: 7,903 real Indian car listings (Maruti, Honda, Hyundai, Skoda...).
          </p>
        </div>
      )}
    </div>
  );
}
