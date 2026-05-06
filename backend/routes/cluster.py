from flask import Blueprint, jsonify, request, current_app

cluster_bp = Blueprint("cluster", __name__)


@cluster_bp.post("/cluster")
def cluster():
    model = current_app.config["UNSUPERVISED_MODEL"]
    data  = request.get_json(silent=True) or {}

    try:
        annual_income  = float(data.get("annual_income",  60000))
        spending_score = float(data.get("spending_score", 50))
    except (TypeError, ValueError):
        return jsonify({"error": "annual_income and spending_score must be numbers"}), 400

    # Clamp to dataset range
    annual_income  = max(10_000, min(150_000, annual_income))
    spending_score = max(1.0,    min(100.0,   spending_score))

    result = model.predict_cluster(annual_income, spending_score)
    result.update({
        "input": {"annual_income": annual_income, "spending_score": spending_score}
    })
    return jsonify(result)
