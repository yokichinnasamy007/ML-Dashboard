from flask import Blueprint, jsonify, request, current_app

predict_bp = Blueprint("predict", __name__)


@predict_bp.post("/predict")
def predict():
    model = current_app.config["SUPERVISED_MODEL"]
    data  = request.get_json(silent=True) or {}

    stats    = model.feature_stats
    features = {}
    for feat in model.feature_names:
        default = stats[feat]["mean"]
        try:
            features[feat] = float(data.get(feat, default))
        except (TypeError, ValueError):
            features[feat] = default
        lo, hi = stats[feat]["min"], stats[feat]["max"]
        features[feat] = max(lo, min(hi, features[feat]))

    # model.predict() returns INR directly (not lakhs)
    price_inr = model.predict(features)
    return jsonify({
        "prediction_inr": price_inr,
        "input_features": features,
    })
