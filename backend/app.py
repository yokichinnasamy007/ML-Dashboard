"""
ML Dashboard — Flask Backend
Trains both Indian-dataset models on startup.
Datasets and model files are saved to disk under backend/data/ and backend/saved_models/.
"""

from flask import Flask, jsonify
from flask_cors import CORS

from model.supervised   import CarPriceModel
from model.unsupervised import CustomerClusterModel
from routes.predict     import predict_bp
from routes.cluster     import cluster_bp
from routes.data        import data_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

    print("\n[app] Training supervised model (Indian Car Selling Price)...")
    sup = CarPriceModel()
    sup.train()

    print("\n[app] Training unsupervised model (Customer Spending Score)...")
    unsup = CustomerClusterModel(n_clusters=5)
    unsup.train()

    app.config["SUPERVISED_MODEL"]   = sup
    app.config["UNSUPERVISED_MODEL"] = unsup

    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(cluster_bp, url_prefix="/api")
    app.register_blueprint(data_bp,    url_prefix="/api")

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "models": [
                {"name": "supervised",
                 "dataset": "Indian Used Car Selling Price (YBIFoundation / Kaggle)"},
                {"name": "unsupervised",
                 "dataset": "Indian Customer Spending Score (YBIFoundation / Kaggle)"},
            ],
            "data_files": ["backend/data/car_selling_price.csv",
                           "backend/data/customer_spending_score.csv"],
            "model_files": ["backend/saved_models/supervised_model.joblib",
                            "backend/saved_models/unsupervised_model.joblib"],
        })

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5000, debug=False)
