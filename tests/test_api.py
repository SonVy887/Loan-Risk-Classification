from fastapi.testclient import TestClient
from api.main import app

SAMPLE_LOAN = {
    "person_age": 30,
    "person_gender": "male",
    "person_education": "Bachelor",
    "person_income": 1800000000,
    "person_emp_exp": 6,
    "person_home_ownership": "MORTGAGE",
    "loan_amnt": 200000000,
    "loan_intent": "HOMEIMPROVEMENT",
    "loan_int_rate": 8.5,
    "cb_person_cred_hist_length": 7,
    "credit_score": 720,
    "previous_loan_defaults_on_file": "No",
    "currency": "VND",
}


def test_health():
    with TestClient(app) as client:
        res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert len(body["loaded_models"]) == 4
    assert body["best_model"] == "xgboost"


def test_models_metadata():
    with TestClient(app) as client:
        res = client.get("/models")
    assert res.status_code == 200
    assert "models" in res.json()
    assert len(res.json()["models"]) == 4


def test_predict_best_model():
    with TestClient(app) as client:
        res = client.post("/predict", json={"features": SAMPLE_LOAN, "model_name": "best"})
    assert res.status_code == 200
    body = res.json()
    assert body["model_used"] == "xgboost"
    assert body["prediction"] in (0, 1)
    assert 0.0 <= body["confidence"] <= 1.0


def test_predict_compare_all_4():
    with TestClient(app) as client:
        res = client.post("/predict/compare", json=SAMPLE_LOAN)
    assert res.status_code == 200
    body = res.json()
    assert len(body["results"]) == 4
    assert "consensus_ratio" in body


def test_predict_invalid_age_returns_422():
    bad_loan = {**SAMPLE_LOAN, "person_age": 150}  # Cố tình gửi tuổi outlier 150
    with TestClient(app) as client:
        res = client.post("/predict", json={"features": bad_loan, "model_name": "best"})
    assert res.status_code == 422