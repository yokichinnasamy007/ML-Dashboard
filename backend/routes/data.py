from flask import Blueprint, jsonify, current_app

data_bp = Blueprint("data", __name__)


@data_bp.get("/data/supervised")
def supervised_data():
    model = current_app.config["SUPERVISED_MODEL"]
    return jsonify(model.to_dict())


@data_bp.get("/data/unsupervised")
def unsupervised_data():
    model = current_app.config["UNSUPERVISED_MODEL"]
    return jsonify(model.to_dict())
