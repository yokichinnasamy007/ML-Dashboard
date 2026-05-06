import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHealth } from "../services/api";
import "./Home.css";

const MODELS = [
  {
    path:    "/supervised",
    icon:    "🚗",
    title:   "Indian Used Car Price Prediction",
    subtitle:"Supervised · Linear Regression",
    desc:    "Predict used car selling prices in Indian Rupees. Trained on 7,903 real Indian car listings (Maruti, Honda, Hyundai, Skoda…). Adjust age, engine, mileage, KM driven and get an instant price estimate.",
    tag:     "Indian Car Selling Price · YBIFoundation / Kaggle",
    accent:  "#6366f1",
    stats:   ["7,903 listings", "R² = 0.70", "11 features"],
  },
  {
    path:    "/unsupervised",
    icon:    "🛍",
    title:   "Indian Customer Spending Segmentation",
    subtitle:"Unsupervised · K-Means (k=5)",
    desc:    "Segment 200 real Indian customers into 5 spending profiles — Budget Savers, Balanced Shoppers, Lavish Shoppers and more — by Annual Income and Spending Score (1–100).",
    tag:     "Customer Spending Score · YBIFoundation / Kaggle",
    accent:  "#f59e0b",
    stats:   ["200 customers", "Silhouette = 0.55", "5 segments"],
  },
];

const TECH = [
  { icon: "🐍", name: "Python / Flask",      color: "#f59e0b" },
  { icon: "⚛️", name: "React 18 + Vite",     color: "#3b82f6" },
  { icon: "🤖", name: "scikit-learn",         color: "#6366f1" },
  { icon: "📊", name: "Recharts",             color: "#10b981" },
  { icon: "💾", name: "joblib model files",   color: "#ef4444" },
  { icon: "🌐", name: "Axios REST API",       color: "#8b5cf6" },
];

export default function Home() {
  const navigate     = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getHealth()
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus("offline"));
  }, []);

  const online = status && status !== "offline";

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-badge">🇮🇳 Real Indian Datasets · Kaggle · Live ML Predictions</div>
        <h1 className="hero-title">
          Machine Learning<br />
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="hero-sub">
          Supervised and unsupervised ML models trained on real Kaggle datasets —
          Indian used car prices and customer spending scores — with interactive charts and live prediction APIs.
        </p>
        <div className="hero-status">
          <span className="status-dot"
            style={{ background: status === null ? "#f59e0b" : online ? "#10b981" : "#ef4444" }} />
          <span>
            {status === null  ? "Connecting to backend…"
             : online         ? "Backend online — Indian dataset models ready"
             : "Backend offline — run: python app.py inside backend/"}
          </span>
        </div>
      </section>

      <section className="models-section">
        <h2 className="section-header">Choose a Model</h2>
        <div className="model-cards">
          {MODELS.map((m) => (
            <div key={m.path} className="model-card"
              onClick={() => navigate(m.path)}
              style={{ "--card-accent": m.accent }}>
              <div className="model-icon">{m.icon}</div>
              <div className="model-tag">{m.tag}</div>
              <h3 className="model-title">{m.title}</h3>
              <p className="model-subtitle">{m.subtitle}</p>
              <p className="model-desc">{m.desc}</p>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {m.stats.map((s) => (
                  <span key={s} style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 6,
                    padding: ".2rem .6rem",
                    fontSize: ".75rem",
                    color: "#94a3b8",
                  }}>{s}</span>
                ))}
              </div>
              <button className="model-btn">Explore →</button>
            </div>
          ))}
        </div>
      </section>

      <section className="tech-section">
        <h2 className="section-header">Tech Stack</h2>
        <div className="tech-grid">
          {TECH.map(({ icon, name, color }) => (
            <div key={name} className="tech-chip">
              <span className="tech-icon" style={{ color }}>{icon}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </section>

      {online && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="section-header">Dataset & Model Files on Disk</h2>
          <div className="grid-2">
            <div className="card">
              <div style={{ fontSize: ".82rem", color: "#64748b", marginBottom: ".6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Raw Datasets (backend/data/)
              </div>
              {status?.data_files?.map((f) => (
                <div key={f} style={{ fontFamily: "monospace", fontSize: ".82rem", color: "#94a3b8", padding: ".25rem 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  {f}
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontSize: ".82rem", color: "#64748b", marginBottom: ".6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Saved Models (backend/saved_models/)
              </div>
              {status?.model_files?.map((f) => (
                <div key={f} style={{ fontFamily: "monospace", fontSize: ".82rem", color: "#94a3b8", padding: ".25rem 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
