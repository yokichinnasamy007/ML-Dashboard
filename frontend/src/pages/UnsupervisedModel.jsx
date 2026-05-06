import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { getUnsupervisedData, postCluster } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import MetricsCard    from "../components/MetricsCard";

const PALETTE = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

function StarShape({ cx, cy, fill }) {
  const s = 10;
  return (
    <polygon
      points={`${cx},${cy - s} ${cx + s * 0.4},${cy + s * 0.3} ${cx - s * 0.9},${cy - s * 0.3} ${cx + s * 0.9},${cy - s * 0.3} ${cx - s * 0.4},${cy + s * 0.3}`}
      fill={fill} stroke="#fff" strokeWidth={1.5}
    />
  );
}

function PointTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <div style={{ color: "#94a3b8" }}>Annual Income: <strong style={{ color: "#f1f5f9" }}>₹{d.x.toLocaleString("en-IN")}</strong></div>
      <div style={{ color: "#94a3b8" }}>Spending Score: <strong style={{ color: "#f1f5f9" }}>{d.y}</strong></div>
      {d.age    && <div style={{ color: "#64748b", fontSize: 11 }}>Age: {d.age}</div>}
      {d.gender && <div style={{ color: "#64748b", fontSize: 11 }}>{d.gender}</div>}
    </div>
  );
}

function CentroidTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #fbbf24", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <div style={{ color: "#fbbf24", fontWeight: 700 }}>★ {d.name}</div>
      <div style={{ color: "#94a3b8" }}>Avg Income: ₹{Number(d.x).toLocaleString("en-IN")}</div>
      <div style={{ color: "#94a3b8" }}>Avg Spending: {d.y}</div>
    </div>
  );
}

export default function UnsupervisedModel() {
  const [info,       setInfo]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [income,     setIncome]     = useState(60000);
  const [spending,   setSpending]   = useState(50);
  const [predicting, setPredicting] = useState(false);
  const [myCluster,  setMyCluster]  = useState(null);
  const [predErr,    setPredErr]    = useState(null);

  useEffect(() => {
    getUnsupervisedData()
      .then(({ data }) => setInfo(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleFind = useCallback(async () => {
    setPredicting(true); setPredErr(null);
    try {
      const { data } = await postCluster({ annual_income: income, spending_score: spending });
      setMyCluster(data);
    } catch (e) {
      setPredErr(e.response?.data?.error || e.message);
    } finally { setPredicting(false); }
  }, [income, spending]);

  if (loading) return <LoadingSpinner message="Downloading Indian Customer Spending Score dataset…" />;
  if (error)   return <div className="page"><div className="error-box">Error: {error}</div></div>;

  const byCluster  = Array.from({ length: 5 }, (_, i) => info.points.filter((p) => p.cluster === i));
  const userPoint  = myCluster ? [{ x: income, y: spending }] : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>🛍 Indian Customer Spending Segmentation</h1>
        <p>Unsupervised · K-Means (k=5) · {info.metrics.dataset}</p>
      </div>

      <MetricsCard metrics={info.metrics} type="unsupervised" />

      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="section-title">Find Customer Segment</div>
          <p style={{ fontSize: ".85rem", color: "#64748b", marginBottom: "1.25rem" }}>
            Enter a customer's Annual Income (₹) and Spending Score to see which of the 5 Indian consumer segments they belong to.
          </p>

          <div style={{ marginBottom: "1.2rem" }}>
            <label>Annual Income (₹)</label>
            <div className="range-row">
              <input type="range" min={10000} max={140000} step={1000} value={income}
                onChange={(e) => { setIncome(+e.target.value); setMyCluster(null); }} />
              <span className="range-val">₹{Number(income).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label>Spending Score (1 – 100)</label>
            <div className="range-row">
              <input type="range" min={1} max={100} step={1} value={spending}
                onChange={(e) => { setSpending(+e.target.value); setMyCluster(null); }} />
              <span className="range-val">{spending}</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%" }}
            onClick={handleFind} disabled={predicting}>
            {predicting ? "Segmenting…" : "Find My Segment"}
          </button>
          {predErr && <div className="error-box" style={{ marginTop: "1rem" }}>{predErr}</div>}

          {myCluster && (
            <div className="result-box" style={{ marginTop: "1.25rem" }}>
              <div className="result-label">Customer Segment</div>
              <span className="cluster-badge"
                style={{ background: PALETTE[myCluster.cluster], fontSize: "1rem",
                         padding: ".45rem 1.2rem", marginBottom: ".6rem", display: "inline-block" }}>
                {myCluster.name}
              </span>
              <div style={{ fontSize: ".82rem", color: "#64748b", marginTop: ".6rem", lineHeight: 1.6 }}>
                {myCluster.description}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Segment Overview</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Count</th>
                <th>Avg Income</th>
                <th>Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {info.stats.map((s) => (
                <tr key={s.cluster}>
                  <td>
                    <span className="cluster-badge"
                      style={{ background: PALETTE[s.cluster], fontSize: ".75rem", padding: ".2rem .6rem" }}>
                      {s.name}
                    </span>
                  </td>
                  <td>{s.count}</td>
                  <td>₹{Number(s.avg_income).toLocaleString("en-IN")}</td>
                  <td>{s.avg_spending}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "1.25rem" }}>
            {info.stats.map((s) => (
              <div key={s.cluster} style={{ marginBottom: ".65rem", fontSize: ".82rem" }}>
                <span className="cluster-badge"
                  style={{ background: PALETTE[s.cluster], fontSize: ".7rem", padding: ".15rem .5rem", marginRight: ".5rem" }}>
                  {s.name}
                </span>
                <span style={{ color: "#64748b" }}>{s.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          Customer Clusters — Annual Income (₹) vs Spending Score
          {myCluster && (
            <span style={{ marginLeft: ".75rem", fontSize: ".8rem",
              background: PALETTE[myCluster.cluster], color: "#fff",
              borderRadius: 999, padding: ".15rem .65rem" }}>
              You → {myCluster.name}
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={440}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis type="number" dataKey="x" name="Annual Income"
              domain={[0, 150000]}
              tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
              tick={{ fill: "#64748b", fontSize: 11 }}
              label={{ value: "Annual Income (₹)", position: "insideBottom", offset: -14, fill: "#64748b", fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="Spending Score"
              domain={[0, 105]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              label={{ value: "Spending Score", angle: -90, position: "insideLeft", offset: 12, fill: "#64748b", fontSize: 12 }} />
            <Tooltip content={<PointTip />} />
            <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, color: "#94a3b8" }} />

            {byCluster.map((pts, i) => (
              <Scatter key={i} name={info.stats[i]?.name || `Cluster ${i}`}
                data={pts} fill={PALETTE[i]} fillOpacity={0.75} />
            ))}

            <Scatter name="Centroids ★" data={info.centroids} fill="#fbbf24" shape={<StarShape />}>
              <Tooltip content={<CentroidTip />} />
            </Scatter>

            {userPoint.length > 0 && (
              <Scatter name="Your Input ▲" data={userPoint} fill="#fff" shape="triangle" fillOpacity={1} />
            )}
          </ScatterChart>
        </ResponsiveContainer>
        <p style={{ fontSize: ".78rem", color: "#475569", marginTop: ".75rem" }}>
          Stars (★) = cluster centroids · Triangle (▲) = your input · Hover points for details.
          Dataset: 200 real Indian customers (YBIFoundation / Kaggle).
        </p>
      </div>
    </div>
  );
}
