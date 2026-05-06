# ML Dashboard — Full-Stack Machine Learning Web App

A complete web application demonstrating **Supervised** and **Unsupervised** machine learning
using **real-world datasets**, a Python/Flask backend, and a React/Vite frontend.

---

## Datasets (100% Real Data)

| Model | Dataset | Source | Size |
|-------|---------|--------|------|
| Supervised | California Housing (1990 US Census) | `sklearn.datasets.fetch_california_housing` | 20,640 rows |
| Unsupervised | Mall Customers | Kaggle CSV via GitHub public mirror | 200 rows |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Recharts, Axios |
| Backend | Python 3.10+, Flask 3, Flask-CORS |
| ML | scikit-learn (LinearRegression, KMeans, StandardScaler) |
| Data | pandas, numpy, requests |

---

## Folder Structure

```
AI-SURIYA/
├── backend/
│   ├── app.py                  ← Flask entry point (trains models on startup)
│   ├── requirements.txt
│   ├── model/
│   │   ├── supervised.py       ← California Housing Linear Regression
│   │   └── unsupervised.py     ← Mall Customers K-Means (k=5)
│   ├── routes/
│   │   ├── predict.py          ← POST /api/predict
│   │   ├── cluster.py          ← POST /api/cluster
│   │   └── data.py             ← GET  /api/data/supervised|unsupervised
│   └── utils/
│       └── preprocessing.py    ← Downloads Mall Customers CSV at runtime
└── frontend/
    ├── index.html
    ├── vite.config.js          ← proxies /api → localhost:5000
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── services/api.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── LoadingSpinner.jsx
        │   └── MetricsCard.jsx
        └── pages/
            ├── Home.jsx
            ├── SupervisedModel.jsx
            └── UnsupervisedModel.jsx
```

---

## Setup Instructions

### Prerequisites

- **Python 3.10+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- Internet connection (backend downloads the Mall Customers CSV on first run)

---

### 1 — Clone / open the project

```bash
# Already in e:\AI-SURIYA — nothing to clone
cd e:\AI-SURIYA
```

---

### 2 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell
venv\Scripts\Activate.ps1

# macOS / Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask (trains both models, then serves API on port 5000)
python app.py
```

Expected output:
```
[app] Training supervised model (California Housing)...
[Supervised] trained — R²=0.6062  RMSE=$65,887  rows=20,640

[app] Training unsupervised model (Mall Customers)...
[preprocessing] Mall Customers loaded: 200 rows
[Unsupervised] trained — silhouette=0.5537  k=5  rows=200

 * Running on http://0.0.0.0:5000
```

---

### 3 — Frontend Setup

Open a **second terminal**:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend health check |
| GET | `/api/data/supervised` | Full model info + sample data |
| GET | `/api/data/unsupervised` | Full cluster data + centroids |
| POST | `/api/predict` | Predict house price (JSON body with 8 features) |
| POST | `/api/cluster` | Get customer segment (JSON: `annual_income`, `spending_score`) |

### Example: Predict house price

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"MedInc": 5.0, "HouseAge": 25, "AveRooms": 6, "AveBedrms": 1.1,
       "Population": 1200, "AveOccup": 3.0, "Latitude": 34.0, "Longitude": -118.0}'
```

### Example: Find customer segment

```bash
curl -X POST http://localhost:5000/api/cluster \
  -H "Content-Type: application/json" \
  -d '{"annual_income": 80, "spending_score": 85}'
```

---

## Features

### Supervised Page (House Price Prediction)
- 8 interactive sliders (one per feature, seeded with dataset mean)
- Live price prediction on button click
- Actual vs Predicted scatter chart (300 test-set points)
- Feature coefficient bar chart (positive = blue, negative = red)
- Model metrics: R², RMSE, MAE, dataset size

### Unsupervised Page (Customer Segmentation)
- Annual Income × Spending Score scatter chart with 5 coloured clusters
- Centroid stars (★) overlaid on chart
- Segment finder — enter income + spending score → see which cluster
- Cluster statistics table (size, avg income, avg spending)
- Silhouette Score displayed as quality metric

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `pip install` fails on scikit-learn | Upgrade pip: `pip install --upgrade pip` |
| `Mall Customers download failed` | Check internet; dataset fetched from GitHub on startup |
| CORS error in browser | Ensure Flask is running on port 5000 |
| Port 5173 in use | Change `port` in `vite.config.js` |
| Models take long to train | California Housing has 20k rows — normal on first run |
