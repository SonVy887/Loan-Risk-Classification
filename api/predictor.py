import json
from pathlib import Path
import joblib
import pandas as pd
import xgboost as xgb

from api.schemas import LoanInput, ShapFactor, SinglePredictionResponse

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"
MODEL_NAMES = ["logistic_regression", "svm", "random_forest", "xgboost"]

FEATURE_LABELS_VI = {
    "previous_loan_defaults_on_file": "Lịch sử vỡ nợ",
    "person_home_ownership": "Tình trạng nhà ở",
    "loan_percent_income": "Tỷ lệ vay / Thu nhập",
    "loan_int_rate": "Lãi suất vay",
    "loan_intent": "Mục đích vay",
    "person_income": "Thu nhập năm",
    "loan_amnt": "Số tiền vay",
    "credit_score": "Điểm tín dụng",
    "person_emp_exp": "Kinh nghiệm làm việc",
    "person_age": "Độ tuổi",
    "cb_person_cred_hist_length": "Thời gian lịch sử tín dụng",
    "person_education": "Trình độ học vấn",
    "person_gender": "Giới tính",
}


class ModelRegistry:
    def __init__(self) -> None:
        self.models: dict = {}
        self.metadata: dict = {}

    def load(self) -> None:
        """Nạp metadata.json và 4 file .joblib vào RAM 1 lần khi startup."""
        self.models.clear()
        meta_path = MODELS_DIR / "metadata.json"
        self.metadata = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}

        for name in MODEL_NAMES:
            path = MODELS_DIR / f"{name}.joblib"
            if path.exists():
                self.models[name] = joblib.load(path)

    @property
    def best_model_name(self) -> str:
        best = self.metadata.get("best_model")
        return best if best in self.models else next(iter(self.models.keys()), "")

    @staticmethod
    def _explain_xgboost(pipeline, df: pd.DataFrame, top_k: int = 5) -> list[ShapFactor]:
        """Tính TreeSHAP trực tiếp từ XGBoost và gộp về 13 đặc trưng gốc."""
        preprocess = pipeline.named_steps["preprocess"]
        classifier = pipeline.named_steps["classifier"]
        X_trans = preprocess.transform(df)
        trans_names = preprocess.get_feature_names_out()
        contribs = classifier.get_booster().predict(xgb.DMatrix(X_trans), pred_contribs=True)[0, :-1]

        grouped: dict[str, float] = {col: 0.0 for col in FEATURE_LABELS_VI}
        for name, val in zip(trans_names, contribs):
            raw = name.split("__", 1)[1] if "__" in name else name
            matched = next((col for col in FEATURE_LABELS_VI if raw == col or raw.startswith(f"{col}_")), None)
            if matched:
                grouped[matched] += float(val)

        ranked = sorted(
            ((col, val) for col, val in grouped.items() if abs(val) > 1e-4),
            key=lambda item: abs(item[1]),
            reverse=True,
        )[:top_k]

        return [
            ShapFactor(
                feature=col,
                label=FEATURE_LABELS_VI[col],
                shap_value=round(val, 4),
                direction="positive" if val >= 0 else "negative",
            )
            for col, val in ranked
        ]

    def predict_one(self, features: LoanInput, model_name: str = "best") -> SinglePredictionResponse:
        resolved = self.best_model_name if model_name == "best" else model_name
        if resolved not in self.models:
            raise KeyError(f"Không tìm thấy mô hình '{resolved}'.")

        pipeline = self.models[resolved]
        df = pd.DataFrame([features.to_model_row()])
        ## 
        pred = int(pipeline.predict(df)[0])
        proba = pipeline.predict_proba(df)[0]

        prob_rejected = round(float(proba[0]), 4)
        prob_approved = round(float(proba[1]), 4)
        confidence = prob_approved if pred == 1 else prob_rejected
        explanation = self._explain_xgboost(pipeline, df) if resolved == "xgboost" else []

        return SinglePredictionResponse(
            model_used=resolved,
            is_best_model=(resolved == self.best_model_name),
            prediction=pred,
            label="Được duyệt" if pred == 1 else "Từ chối",
            confidence=confidence,
            probabilities={"rejected": prob_rejected, "approved": prob_approved},
            explanation=explanation,
        )

    def predict_compare(self, features: LoanInput) -> dict:
        results = [self.predict_one(features, name) for name in MODEL_NAMES if name in self.models]
        approved_votes = sum(1 for r in results if r.prediction == 1)
        rejected_votes = len(results) - approved_votes
        total = len(results)

        if approved_votes > rejected_votes:
            consensus_label = "Được duyệt"
            consensus_ratio = f"{approved_votes}/{total} mô hình đồng thuận: Được duyệt"
        elif rejected_votes > approved_votes:
            consensus_label = "Từ chối"
            consensus_ratio = f"{rejected_votes}/{total} mô hình đồng thuận: Từ chối"
        else:
            best_res = next(r for r in results if r.is_best_model)
            consensus_label = best_res.label
            consensus_ratio = f"Hòa {approved_votes}/{total} — Ưu tiên theo {self.best_model_name}: {best_res.label}"

        return {
            "best_model": self.best_model_name,
            "consensus_label": consensus_label,
            "consensus_ratio": consensus_ratio,
            "results": results,
        }


registry = ModelRegistry()